const url_Shortener_API = "/api/save_url";
const url_statistics_API = "/api/get_url_stats";

hide_alert = null;

const alert_container = document.querySelector(".alert_container");
const form = document.querySelector("form");
const textarea = document.querySelector("textarea");
function showAlert(alert, status = 0) {
	//*0 - error; 1 - success
	if (hide_alert != undefined && hide_alert != null) {
		clearTimeout(hide_alert);
	}
	alert_container.value = alert;
	alert_container.style = "";
	alert_container.style.opacity = 1;
	alert_container.style.width = "100%";
	if (status == 0) {
		alert_container.style.background = "#FF000080";
		alert_container.value = "| " + alert_container.value;
		hide_alert = setTimeout(() => {
			alert_container.style = "";
		}, 2000);
	} else {
		alert_container.style.background = "var(--color)";
		alert_container.style.textAlign = "center";
		alert_container.style.border = "3px dashed var(--background-color)";
		alert_container.style.cursor = "pointer";
		alert_container.disabled = false;
		form.style.height = "0px";
		form.style.opacity = "0";
	}
}

function isValid(x) {
	return x && x.toString().trim() !== "";
}
form.addEventListener("submit", () => {
	event.preventDefault();

	const form_data = new FormData(form);
	const url = form_data.get("url");
	textarea.style.opacity = 0;

	if (isValid(url)) {
		const submit_button = form.querySelector("input[type=submit]");
		submit_button.disabled = true;

		fetch(url_Shortener_API, {
			method: "POST",
			body: JSON.stringify({ url: url }),
			headers: {
				"content-type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				setTimeout(() => {
					submit_button.disabled = false;
				}, 2000);
				if (data.statusMessage == "success") {
					form.reset();

					showAlert(window.location.host + "/" + data.url.shortened_url, 1);
				} else if (data.statusMessage.startsWith("Error")) {
					showAlert(data.statusMessage, 0);
				}
			});
	} else {
		showAlert("Error: Invalid Url", 0);
	}
});

form.addEventListener("keyup", async (event) => {
	if (event.keyCode == 36) {
		const form_data = new FormData(form);
		const url = form_data.get("url");
		textarea.style.opacity = 0;
		var url_stats = await fetch(url_statistics_API, {
			method: "POST",
			body: JSON.stringify({ url: url }),
			headers: {
				"content-type": "application/json",
			},
		});

		url_stats = await url_stats.json();
		console.log(url_stats);
		textarea.style.opacity = 0;
		setTimeout(() => {
			textarea.style = "";
			if (url_stats.statusMessage.startsWith("Error")) {
				textarea.style = `
	opacity: 1;
    color: coral;
    text-align: center;
    line-height: 6.5;
    vertical-align: middle;`;
				textarea.innerHTML = JSON.stringify(
					url_stats.statusMessage,
					undefined,
					2
				);
			} else {
				textarea.style = "opacity: 1;";
				url_stats.url.created_date = new Date(
					url_stats.url.created_date
				).toLocaleString();
				textarea.innerHTML = JSON.stringify(url_stats.url, undefined, 2);
			}
		}, 300);
	}
});

alert_container.addEventListener("click", (event) => {
	event.preventDefault();
	alert_container.focus();
	alert_container.select();
	document.execCommand("copy");
	form.style = "";
	alert_container.style = "";
	alert_container.disabled = true;
});
