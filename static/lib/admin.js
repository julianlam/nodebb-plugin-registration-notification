'use strict';

define('admin/plugins/registration-notification', ['settings', 'alerts'], function (Settings, alerts) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('registration-notification', $('.registration-notification-settings'));

		$('#save').on('click', function () {
			Settings.save('registration-notification', $('.registration-notification-settings'), function () {
				alerts.alert({
					type: 'success',
					alert_id: 'registration-notification-saved',
					title: 'Settings Saved',
				});
			});
		});
	};

	return ACP;
});
