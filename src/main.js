window.__SV_RUNTIME_ERRORS = [];

function isKnownExtensionAsyncChannelError(message) {
	const text = String(message || "");
	return text.includes("message channel closed before a response was received")
		|| text.includes("A listener indicated an asynchronous response by returning true");
}

function recordRuntimeError(source, payload) {
	const entry = {
		at: Date.now(),
		source,
		...payload
	};

	window.__SV_RUNTIME_ERRORS.push(entry);
	if (window.__SV_RUNTIME_ERRORS.length > 120) {
		window.__SV_RUNTIME_ERRORS.splice(0, window.__SV_RUNTIME_ERRORS.length - 120);
	}

	console.error("[SV runtime-error]", entry);
}

window.addEventListener("error", (event) => {
	if (isKnownExtensionAsyncChannelError(event.message)) {
		// Browser-extension noise (outside game logic); ignore to keep diagnostics focused.
		event.preventDefault();
		return;
	}

	const isAnonymousScriptError = event.message === "Script error."
		&& !event.filename
		&& Number(event.lineno) === 0;
	if (isAnonymousScriptError) {
		// Cross-origin script errors do not include actionable stack details.
		event.preventDefault();
		return;
	}

	recordRuntimeError("window.error", {
		message: event.message,
		filename: event.filename,
		lineno: event.lineno,
		colno: event.colno,
		stack: event.error?.stack || null
	});
}, true);

window.addEventListener("unhandledrejection", (event) => {
	const reason = event.reason;
	const message = reason?.message || String(reason);
	if (isKnownExtensionAsyncChannelError(message)) {
		// Browser-extension noise (outside game logic); ignore to keep diagnostics focused.
		event.preventDefault();
		return;
	}

	recordRuntimeError("window.unhandledrejection", {
		message,
		stack: reason?.stack || null
	});
}, true);

window.onunhandledrejection = (event) => {
	const reason = event?.reason;
	const message = reason?.message || String(reason);
	if (isKnownExtensionAsyncChannelError(message)) {
		event.preventDefault();
		return true;
	}
	return false;
};

window.game = new Phaser.Game(window.createGameConfig());
