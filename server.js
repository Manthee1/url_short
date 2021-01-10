const monk = require("monk");
const cors = require("cors");
var validUrl = require("valid-url");
var urlExists = require("url-exist");
const express = require("express");
const app = express();

require("dotenv").config();

const port = process.env.SERVER_PORT;

const db = monk("localhost/url_short");
const url_data = db.get("url_data");

app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

function isValid(x) {
	return x && x.toString().trim() !== "";
}

async function getRandomUnoccupiedUrl(len = 8) {
	while (true) {
		let ranToken = Math.random().toString(20).substr(2, len);
		let url = await url_data.findOne({ shortened_url: ranToken });
		if (url == null) return ranToken;
	}
}

function parseUrl(url) {
	//Parses the url and makes
	!url.startsWith("https://") &&
		!url.startsWith("http://") &&
		(url = "https://" + url);

	url.endsWith("/") && (url = url.substring(url.length - 1, 0));
	return url;
}

app.post("/api/get_url_stats", async (req, res) => {
	var main_url = req.body.url;

	main_url = parseUrl(main_url);

	try {
		if (!isValid(main_url) || !(await urlExists(main_url))) throw "Invalid Url";

		var url_info = await url_data.findOne({ main_url: main_url });

		if (url_info == null) throw "Non Existent Url";
		else
			delete url_info["_id"] && //remove _id from json
				res.json({ statusMessage: "success", url: url_info });
	} catch (error) {
		if (error == "Invalid Url")
			res.json({ statusMessage: "Error : Invalid Url" });
		else if (error == "Non Existent Url")
			res.json({
				statusMessage: "Error : Url not found",
			});
		else console.error(error);
	}
});
app.post("/api/save_url", async (req, res) => {
	var main_url = req.body.url;

	main_url = parseUrl(main_url);

	try {
		if (!isValid(main_url) || !(await urlExists(main_url))) throw "Invalid Url";

		var url_info = await url_data.findOne({ main_url: main_url });

		var fullUrl = req.protocol + "://" + req.get("host");

		if (url_info == null) {
			// If url does not exists then create it
			const url_info = {
				main_url: main_url,
				shortened_url: await getRandomUnoccupiedUrl(),
				created_date: Date(),
				clicks: 0,
			};
			url_data.insert(url_info).then((created_data) => {
				res.json({
					alreadyCreated: "NO",
					statusMessage: "success",
					url: created_data,
				});
				console.log("New short created: ", url_info);
			});
		} else {
			// if the url exists just respond with that
			res.json({
				alreadyCreated: "YES",
				statusMessage: "success",
				url: url_info,
			});
		}
	} catch (error) {
		if (error == "Invalid Url")
			res.json({ statusMessage: "Error : Invalid Url" });
		else console.error(error);
	}
});

app.get("/view", async (req, res) => {
	res.json(await getRandomUnoccupiedUrl());
});

app.get("/:id", async (req, res) => {
	const { id } = req.params;

	var url_info = await url_data.findOne({ shortened_url: id });

	if (url_info) {
		await url_data.findOneAndUpdate(url_info, {
			$set: { clicks: url_info.clicks + 1 },
		});
		console.log("New click on: ", url_info);

		if (
			url_info.main_url.startsWith("http://") ||
			url_info.main_url.startsWith("https://")
		) {
			res.redirect(url_info.main_url);
		} else {
			res.redirect("https://" + url_info.main_url);
		}
		// res.send(`<script>window.location='${url_info.main_url}'</script>`);
		// res.redirect()
		// res.send(url_info.main_url);
	} else {
		res.send("Invalid link");
		res.end();
	}
});

app.listen(port, () => console.log(`url_short listening on port ${port}!`));
