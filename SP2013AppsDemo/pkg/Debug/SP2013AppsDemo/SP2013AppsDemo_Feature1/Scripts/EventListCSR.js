//////////////////////
// CSR Functions
//////////////////////

// List View Override
function EventListViewOverrides() {
    var overrideCtx = {};
    overrideCtx.Templates = {};
    overrideCtx.BaseViewID = '1';
    overrideCtx.ListTemplateType = 10001;
    overrideCtx.OnPostRender = EventListPostRender;
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrideCtx);
};

// PostRender Override Function
function EventListPostRender(ctx) {
    // insert kanto (japan tokyo area) map
    $("#DeltaPlaceHolderMain").after('<table border="0" style="table-layout:fixed">' +
        '<tr height="90px">' +
        '  <td id="div-saitama">' +
        '  </td>' +
        '  <td rowspan="3" valign="middle">' +
        '  <img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/kanto.jpg" />' +
        '  </td>' +
        '  <td>' +
        '</td>' +
        '</tr>' +
        '<tr height="70px">' +
        '  <td id="div-tokyo">' +
        '  </td>' +
        '  <td id="div-chiba" rowspan="2">' +
        '  </td>' +
        '</tr>' +
        '<tr height="130px">' +
        '  <td id="div-kanagawa">' +
        '  </td>' +
        '</tr>' +
        '</table>\n');
    // insert data to map
    $.each(ctx.ListData.Row, function (i, val) {
        if(val.Pref == '東京都')
            $('#div-tokyo')[0].innerHTML += '<img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/place.png" width="30px">' + val.Title + '<br />';
        else if (val.Pref == '埼玉県')
            $('#div-saitama')[0].innerHTML += '<img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/place.png" width="30px">' + val.Title + '<br />';
        else if (val.Pref == '神奈川県')
            $('#div-kanagawa')[0].innerHTML += '<img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/place.png" width="30px">' + val.Title + '<br />';
        else if (val.Pref == '千葉県')
            $('#div-chiba')[0].innerHTML += '<img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/place.png" width="30px">' + val.Title + '<br />';
    });
}

// Execute override using CSR (List View)
RegisterModuleInit("EventListCSR.js", EventListViewOverrides); // for MDS
EventListViewOverrides(); // for non-MDS

// List Form Override
function EventListFormOverrides() {
    var overrideCtx = {};
    overrideCtx.Templates = {};
    overrideCtx.ListTemplateType = 10001;
    overrideCtx.Templates.Fields = {
        'Title': {
            'NewForm': FormTitle,
            'EditForm': FormTitle
        }
    };
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrideCtx);
};

//function TestRender(ctx) {
//    var formCtx =
//        SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);
//    $("#DeltaPlaceHolderMain").after('<table border="1" style="table-layout:fixed">' +
//        '<tr height="90px">' +
//        '  <td id="div-saitama">' +
//        '  </td>' +
//        '  <td rowspan="3" valign="middle">' +
//        '  <img src="' + ctx.HttpRoot + '/Lists/DemoResources/Images/kanto.jpg" />' +
//        '  </td>' +
//        '  <td>' +
//        '</td>' +
//        '</tr>' +
//        '<tr height="70px">' +
//        '  <td id="div-tokyo">' +
//        '  </td>' +
//        '  <td id="div-chiba" rowspan="2">' +
//        '  </td>' +
//        '</tr>' +
//        '<tr height="130px">' +
//        '  <td id="div-kanagawa">' +
//        '  </td>' +
//        '</tr>' +
//        '</table>');
//}

// Form Field Override Function
function FormTitle(ctx) {
    var formCtx =
        SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);
    var inputId = formCtx.fieldName + '_' + formCtx.fieldSchema.Id + '_$TextField';
    var inputObj = null;
    if (formCtx.controlMode == SPClientTemplates.ClientControlMode.NewForm ||
        formCtx.controlMode == SPClientTemplates.ClientControlMode.EditForm) {

        // ClientValidator Callback
        var validators = new SPClientForms.ClientValidation.ValidatorSet();
        formCtx.registerClientValidator(formCtx.fieldName, validators);

        // Init Callback
        formCtx.registerInitCallback(formCtx.fieldName, function () {
            inputObj = $('#' + selectorEscape(inputId));
        });

        // Focus Callback
        formCtx.registerFocusCallback(formCtx.fieldName, function () {
            if (inputObj != null)
                inputObj.focus();
        });

        // ValidationError Callback
        formCtx.registerValidationErrorCallback(formCtx.fieldName, function (errorResult) {
        });

        // GetValue Callback
        formCtx.registerGetValueCallback(formCtx.fieldName, function () {
            if (inputObj == null)
                return '';
            else
                return inputObj.val();
        });

        formCtx.updateControlValue(
            formCtx.fieldName,
            formCtx.fieldValue ? formCtx.fieldValue : '');

        // original : <span dir="none"><input title="タイトル" class="ms-long ms-spellcheck-true" id="Title_afb7686f-7d8a-4f53-9643-ad4c6e40bc6f_$TextField" type="text" maxlength="255" value="" /><br/></span>
        return '<span dir="none"><input title="' + formCtx.fieldSchema.Title + '" ' +
            'class="ms-long ms-spellcheck-true" ' +
            'id=' + STSHtmlEncode(inputId) + ' ' +
            'type="text" ' +
            'maxlength="' + formCtx.fieldSchema.MaxLength + '" ' +
            'value="' + (formCtx.fieldValue ? formCtx.fieldValue : '') + '" ' +
            'onblur="javascript:searchAddress(this.value);" ' +
            '/><br/></span>';
    }
    return '';
}

// Execute override using CSR (List Form)
RegisterModuleInit("EventListCSR.js", EventListFormOverrides); // for MDS
EventListFormOverrides(); // for non-MDS

// Needed for ScriptOnDemand
if (typeof (Sys) != "undefined" && Boolean(Sys) && Boolean(Sys.Application)) {
    Sys.Application.notifyScriptLoaded();
}
if (typeof (NotifyScriptLoadedAndExecuteWaitingJobs) == "function") {
    NotifyScriptLoadedAndExecuteWaitingJobs("EventListCSR.js");
}

//////////////////////
// Logic Functions
//////////////////////

function searchAddress(locname) {
    var prefCtrl = $("input[title = '都道府県']");
    var addrCtrl = $("input[title = 'その他住所']");
    if (prefCtrl.val().length <= 0 && addrCtrl.val().length <= 0) {
        //prefCtrl.val(locname); // OK!
        var requestUri =
            'https://dev.virtualearth.net/REST/v1/Locations' +
            '?output=json' +
            '&query=' + encodeURI(locname) +
            '&key=Ao5dhnS2_AxbDpUtrmNVbpHJ6si_MLFlg5ne7lsI0K7DjjB94NU7tCufe5B4HV_o&c=ja-jp';
        $.ajax({
            url: requestUri,
            dataType: 'jsonp',
            jsonp: 'jsonp',
            success: function (data, status) {
                if (data &&
                    data.resourceSets &&
                    data.resourceSets.length > 0 &&
                    data.resourceSets[0].resources &&
                    data.resourceSets[0].resources.length > 0) {

                    // テキストボックスに住所を設定
                    if(data.resourceSets[0].resources[0].address.adminDistrict)
                        prefCtrl.val(data.resourceSets[0].resources[0].address.adminDistrict);
                    var city = (data.resourceSets[0].resources[0].address.locality ? data.resourceSets[0].resources[0].address.locality : '');
                    var line = (data.resourceSets[0].resources[0].address.addressLine ? data.resourceSets[0].resources[0].address.addressLine : '');
                    addrCtrl.val(city + line);

                    // メッセージを表示
                    SP.UI.Notify.addNotification('The address of ' + data.resourceSets[0].resources[0].name + ' found !');
                }
            }
            //,error: function () {
            //    $('#msgline').html('error.');
            //}
        }); // ajax

    }
}

//////////////////////
// Helper Functions
//////////////////////

// Escape jquery selector
// (SharePoint uses comma and dollar mark for id.)
function selectorEscape(arg) {
    return arg.replace(
        new RegExp('(,|\\.|\'|\\$|&|\\/|\\\\|!|\\||\\+|\\*|~|=|>|;|:|#|"|\\^|\\(|\\)|\\[|\\])', 'g'),
        '\\$1');
    //var result = iid;
    //result = result.replace(/,/g, '\\,');
    //result = result.replace(/(\$)/g, '\\\$');
    //return result;
}
