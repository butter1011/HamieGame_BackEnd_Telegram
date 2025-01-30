


const scriptsInEvents = {

	async EventGameplay_Event3_Act3(runtime, localVars)
	{
		if (window.Telegram.WebApp) {
			Telegram.WebApp.ready();
			window.Telegram.WebApp.expand();
			window.Telegram.WebApp.enableClosingConfirmation();
			// Get the Telegram UserInfo
			const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
		
			// Init the global variables
			runtime.globalVars.telegramId = telegramId;
		}
		
	},

	async EventGameplay_Event22_Act1(runtime, localVars)
	{
		runtime.callFunction("updateData");
	},

	async EventMenu_Event3_Act3(runtime, localVars)
	{
		if (window.Telegram.WebApp) {
			Telegram.WebApp.ready();
			window.Telegram.WebApp.expand();
		
			// Get the Telegram UserInfo
			const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
			const username = window.Telegram.WebApp.initDataUnsafe.user.username || ""; // Fallback if username is not available
			const firstName = window.Telegram.WebApp.initDataUnsafe.user.first_name || ""; // Fallback if first name is not available
			const lastName = window.Telegram.WebApp.initDataUnsafe.user.last_name || ""; // Fallback if last name is not available
		
			// Init the global variables
			runtime.globalVars.telegramId = telegramId;
			runtime.globalVars.userName = username;
			runtime.globalVars.firstName = firstName;
			runtime.globalVars.lastName = lastName;
		
			runtime.callFunction("InitUser");
		}
		
	},

	async EventScore_Event2_Act1(runtime, localVars)
	{
		if (window.Telegram.WebApp) {
			Telegram.WebApp.ready();
			window.Telegram.WebApp.expand();
			
			window.Telegram.WebApp.enableClosingConfirmation();
			// Get the Telegram UserInfo
			const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
		
			// Init the global variables
			runtime.globalVars.telegramId = telegramId;
			
		
			
		}
		
	},

	async Event_leaderboard_Event3_Act5(runtime, localVars)
	{
		if (window.Telegram.WebApp) {
			Telegram.WebApp.ready();
			window.Telegram.WebApp.expand();
			window.Telegram.WebApp.enableClosingConfirmation();
			// Get the Telegram UserInfo
			const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
		
			// Init the global variables
			runtime.globalVars.telegramId = telegramId;
		
		}
		
		
	},

	async Event_leaderboard_Event5_Act2(runtime, localVars)
	{
		console.log(JSON);
	},

	async Event_leaderboard_Event8_Act1(runtime, localVars)
	{
		runtime.callFunction("InitScreen");
	},

	async Event_tuturial_Event1_Act1(runtime, localVars)
	{
		// if (window.Telegram.WebApp) {
		// 	Telegram.WebApp.ready();
		// 	window.Telegram.WebApp.expand();
		// }
		
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

