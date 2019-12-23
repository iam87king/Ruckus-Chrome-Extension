'use strict';

function initTicketRedirectorTextbox () {
	$('#ticketRedirectorTextbox').textbox({
		buttonText : 'Search',
    	iconCls : 'icon-search',
    	iconAlign : 'left',
		prompt : 'Any Number Here',
		inputEvents : $.extend({}, $.fn.textbox.defaults.inputEvents, {
			keyup : function (e) {
				if (e.which !== 13) {
					return;
				}

				goToTicket($(e.data.target).textbox('getValue'));
			}
		}),
		onClickButton : function () {
			goToTicket(this.value);
		}
	});
}

function initBookmarkSearchTextBox () {
	$('#bookmarkSearchTextbox').combobox({
		iconCls : 'icon-search',
    	iconAlign : 'left',
        prompt : 'Bookmark Title Here',
		panelHeight : 'auto',
		panelMaxHeight : 200,
		valueField : 'url',
		textField : 'title',
		hasDownArrow : false,
		selectOnNavigation : false,
		formatter : bookmarkSearchResoultFormatter,
		onChange : function (newValue, oldValue) {
			if (newValue.length < 2) {
				return;
			}

			var self = this;
			chrome.bookmarks.search(newValue, function (results) {
				results = results.filter(function (result) {
					return result.url;
				});
				$(self).combobox('loadData', results);
			});
		},
		onSelect : function (record) {
			if (record.url) {
				chrome.tabs.create({ url : record.url });
			}
		}
	});
}

function initWidenDescAreaBtn () {
	$('#widenDescAreaBtn').linkbutton({
	    text: 'Widen description area',
	    iconCls : 'icon-widening',
		onClick : function () {
			sendMessageToCurrentWindow({ action : 'widenDescriptionArea' });
		}
	});
}

function initEnablePerforceChangeBtn () {
	$('#enablePerforceChangeBtn').linkbutton({
	    text: 'Enable Perforce Change',
	    iconCls : 'icon-unlock',
		onClick : function () {
		    sendMessageToCurrentWindow({ action : 'enablePerforceChange' });
		}
	});
}

function initPopulateFormBtn () {
	$('#populateFormBtn').linkbutton({
	    text: 'Populate the form',
	    iconCls : 'icon-fill-form',
		onClick : function () {
			chrome.storage.sync.get('resolveIssueFormData', function (data) {
		        if (data.resolveIssueFormData) {
		            // Collateral
				    populateField ('select', 'Collateral', data.resolveIssueFormData.collateral);

					// Fix Version/s
					populateField ('suggestion', 'Fix Version/s', data.resolveIssueFormData.fixVersion);

				    // Root Cause
				    populateField ('text', 'Root CAUSE', data.resolveIssueFormData.rootCause);

				    // integrate-to-active-branches
				    populateField ('select', 'integrate-to-active-branches', data.resolveIssueFormData.i23s);

					// Bug Source
					populateField ('select', 'Bug Source', data.resolveIssueFormData.bugSource);

				    // Fixed in Build
				    populateLatestBuildNumber(data.resolveIssueFormData.module, data.resolveIssueFormData.releaseVersion);

					// Comment
				    populateComment(data.resolveIssueFormData.module, data.resolveIssueFormData.releaseVersion);

				    // Autofill Comment
				    if (data.resolveIssueFormData.autofillComment === 'YES') {
				    	chrome.storage.sync.get('options', function (data) {
					        populateField ('text', 'Comment', data.options.autofillCommentText.template);
					    });
				    }
		        }
		    });
		}
	});

	$('#openFormTemplateBtn').tooltip({
		content : $('<div></div>'),
        showEvent : 'click',
		hideEvent : 'dblclick',
		position : 'left',
		deltaY : 10,
        onUpdate : function (content) {
            content.panel({
                width : 300,
				height : 320,
                border : false,
                title : 'Set Default Values',
				href : '../../html/resolveIssueFormTemplate.html',
				tools : [{
					iconCls : 'icon-no',
					handler : () => $('#openFormTemplateBtn').tooltip('hide')
				}],
				footer : '#populateFormFooter',
				onLoad : initResolveIssueFormTemplate
            });

            $('#populateFormSaveBtn').linkbutton({
				text : 'Save',
				iconCls : 'icon-save',
				onClick : function () {
		            chrome.storage.sync.get('resolveIssueFormData', function (data) {
		            	var resolveIssueFormData = data.resolveIssueFormData || {};
		            	resolveIssueFormData.collateral = $('#collateral').combobox('getValue');
		                resolveIssueFormData.fixVersion = $('#fixVersion').textbox('getValue');
		                resolveIssueFormData.rootCause = $('#rootCause').textbox('getValue');
		                resolveIssueFormData.i23s = $('#i23s').combobox('getValue');
		                resolveIssueFormData.bugSource = $('#bugSource').combobox('getValue');
						resolveIssueFormData.releaseVersion = $('#releaseVersion').combobox('getValue');
						resolveIssueFormData.autofillComment  = $('#autofillComment').combobox('getValue');

						chrome.storage.sync.set({ resolveIssueFormData : resolveIssueFormData }, () => $('#openFormTemplateBtn').tooltip('hide'));
		            });
				}
			});

			$('#populateFormCancelBtn').linkbutton({
				text : 'Cancel',
				iconCls : 'icon-cancel',
				onClick : () => $('#openFormTemplateBtn').tooltip('hide')
			});
        },
        onShow : function () {
            $('body').addClass('large-panel');
			$(this).tooltip('reposition');
			showMask(true);
			setResolveIssueFormTemplateData();
        },
		onHide : function () {
			$('body').removeClass('large-panel');
			showMask(false);
		}
	}).linkbutton({
		iconCls : 'icon-mini-edit'
	});
}

function initGenFisheyeLazyTextBtn () {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var hostname = getHostNameFromUrl(tabs[0].url);

		$('#genFisheyeLazyText').linkbutton({
		    text: 'Generate Fisheye Lazy Text',
		    iconCls : 'icon-sum',
			disabled : hostname !== 'fisheye.video54.local',
			onClick : function () {
				sendMessageToCurrentWindow({ action : 'copyGeneratedFisheyeLazyText' });
			}
		});
	});
}

function initFormFields () {
	initTicketRedirectorTextbox();
	initBookmarkSearchTextBox();
	initWidenDescAreaBtn();
	initEnablePerforceChangeBtn();
	initPopulateFormBtn();
	initGenFisheyeLazyTextBtn();
}

function activateFormFields (active) {
	$('#fieldsVisibilitySwitcher').switchbutton(active ? 'enable' : 'disable');
	enableLinkButton('populateFormBtn', active);
	enableLinkButton('enablePerforceChangeBtn', active);
}

function enableLinkButton (id, enabled) {
	$('#' + id).linkbutton(enabled ? 'enable' : 'disable');
}


$(document).ready(function() {
	initFormFields();

	sendMessageToCurrentWindow({ action : 'isResolveIssueFormOpen' }, function (response) {
	  	activateFormFields(response && response.isOpen);
	});

	sendMessageToCurrentWindow({ action : 'isDescAreaVisible' }, function (response) {
	  	enableLinkButton('widenDescAreaBtn', response && response.isVisible);
	});

	$('#ticketRedirectorTextbox').textbox('textbox').focus();
});
