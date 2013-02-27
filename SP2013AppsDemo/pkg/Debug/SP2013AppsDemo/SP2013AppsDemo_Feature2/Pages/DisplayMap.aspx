<%-- 次の 4 行は、SharePoint コンポーネントの使用時に必要な ASP.NET ディレクティブです --%>

<%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" MasterPageFile="~masterurl/default.master" Language="C#" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%-- 次の Content 要素内のマークアップとスクリプトはページの <head> 内に配置されます --%>
<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <script type="text/javascript" src="../Scripts/jquery-1.7.1.min.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.runtime.debug.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.debug.js"></script>

    <!-- 次のファイルに JavaScript を追加します -->
    <script type="text/javascript" src="../Scripts/jquery-1.7.1.min.js"></script>
    <script type="text/javascript" src="https://dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=6.3&mkt=ja-jp&s=1"></script>
    <script>
        var map = null;
        var orgPref = '', orgAddr = '';

        $(document).ready(function () {
            var params = getQueryParams();
            var context = null;
            var web = null;
            var list = null;
            var litem = null;

            //
            // get location info from SharePoint
            //
            $('#msgline').html('searching from SharePoint ...');
            context = SP.ClientContext.get_current();
            web = context.get_web();
            list = web.get_lists().getById(params['list']);
            litem = list.getItemById(Number(params['item']));
            context.load(litem);
            context.executeQueryAsync(function () {
                //
                // update control
                //
                orgPref = litem.get_item('Pref') ? litem.get_item('Pref') : '';
                $('#prefctl').val(orgPref);
                orgAddr = litem.get_item('Address') ? litem.get_item('Address') : '';
                $('#addrctl').val(orgAddr);

                //
                // load and update bing maps
                //
                map = new VEMap('map');
                map.LoadMap();
                map.SetCenterAndZoom(new VELatLong(35.70, 139.7), 13);
                setEvent();
                updateMap();
                buttonEnableCheck();
            }, function (sender, args) {
                $('#msgline').html('sharepoint error.');
            });
        }); // ready

        function getQueryParams() {
            var params = [];
            var arrays = location.search.substr(1).split('&');
            for(var i = 0; i < arrays.length; i++) {
                var elems = arrays[i].split('=');
                var key = decodeURIComponent(elems[0]);
                var val = decodeURIComponent(elems[1]);
                params.push(key);
                params[key] = val;
            }
            return params;
        }

        function setEvent() {
            $('.locctrl').blur(function () {
                if ($('#prefctl').val().length > 0 || $('#addrctl').val() > 0) {
                    updateMap();
                    buttonEnableCheck();
                }
            });

            map.AttachEvent("onclick", function (e) {
                // right click only !
                if (!e.rightMouseButton)
                    return;

                $('#msgline').html('getting location ...');

                // get latlong from mouse point
                var lat;
                if (e.latLong) {
                    lat = e.latLong;
                } else {
                    var pxl = new VEPixel(e.mapX, e.mapY);
                    lat = map.PixelToLatLong(pxl);
                }

                // set push pin
                map.Clear()
                var shape = new VEShape(VEShapeType.Pushpin, lat);
                map.AddShape(shape);

                // get location info from latlong
                map.FindLocations(lat, function (loc) {
                    var pref = '', addr = '';
                    var prefidx = loc[0].Name.search(/都|道|府|県/);
                    if (prefidx != -1) {
                        var pref = loc[0].Name.substr(0, prefidx + 1);
                        if (prefidx + 1 < loc[0].Name.length)
                            var addr = loc[0].Name.substr(prefidx + 1);
                    }
                    else {
                        addr = loc[0].Name;
                    }
                    $('#prefctl').val(pref);
                    $('#addrctl').val(addr);
                    $('#msgline').html('location changed');
                    buttonEnableCheck();
                });
            }); // AttachEvent

            $('#btn0').click(function () {
                var params = getQueryParams();
                location.href = params['source'];
            });

            $('#btn1').click(function () {
                //
                // update sharepoint item
                //
                var params = getQueryParams();
                var context = null;
                var web = null;
                var list = null;
                var litem = null;

                $('#msgline').html('changing SharePoint item ...');
                context = SP.ClientContext.get_current();
                web = context.get_web();
                list = web.get_lists().getById(params['list']);
                litem = list.getItemById(Number(params['item']));
                litem.set_item('Pref', $('#prefctl').val());
                litem.set_item('Address', $('#addrctl').val());
                litem.update();
                context.executeQueryAsync(function () {
                    $('#msgline').html('item changed.');
                    location.href = params['source'];
                }, function (sender, args) {
                    $('#msgline').html('sharepoint error.');
                });
            });
        }

        function updateMap() {
            //map.Find(null,
            //    '東京都世田谷区太子堂',
            //    null, null, null, null, null, null, null, null,
            //    function (layer, resultsArray) {
            //        $('#msgline').html('マップ変更');
            //    });

            var address = $('#prefctl').val() + $('#addrctl').val();
            var requestUri =
                'https://dev.virtualearth.net/REST/v1/Locations?'
                + 'output=json&countryRegion=JP&addressLine='
                + encodeURIComponent(address) +
                '&key=Ao5dhnS2_AxbDpUtrmNVbpHJ6si_MLFlg5ne7lsI0K7DjjB94NU7tCufe5B4HV_o&c=ja-jp';
            $.ajax({
                url: requestUri,
                dataType: 'jsonp',
                jsonp: 'jsonp',
                beforeSend: function (xhr) {
                    $('#msgline').html('changing map ...');
                },
                success: function (data, status) {
                    if (data &&
                        data.resourceSets &&
                        data.resourceSets.length > 0 &&
                        data.resourceSets[0].resources &&
                        data.resourceSets[0].resources.length > 0) {

                        // 返された bbox (位置情報) の内容から地図を更新
                        var bbox = data.resourceSets[0].resources[0].bbox;
                        map.SetMapView(new VELatLongRectangle(
                            new VELatLong(bbox[0], bbox[1]),
                            new VELatLong(bbox[2], bbox[3])));

                        // Bing Map にプッシュピンを設定
                        var lat = new VELatLong(
                            data.resourceSets[0].resources[0].point.coordinates[0],
                            data.resourceSets[0].resources[0].point.coordinates[1]);
                        var pin = new VEShape(VEShapeType.Pushpin, lat);
                        map.AddShape(pin);
                    }
                    $('#msgline').html('initialization succeeded');
                },
                error: function () {
                    $('#msgline').html('map error.');
                }
            }); // ajax
        }

        function buttonEnableCheck() {
            if(orgPref == $('#prefctl').val() && orgAddr == $('#addrctl').val())
                $('#btn1').attr('disabled', true);
            else
                $('#btn1').attr('disabled', false);
        }

    </script>
</asp:Content>

<%-- 次の Content 要素内のマークアップとスクリプトはページの <body> 内に配置されます --%>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <table border="0">
        <tr>
            <td>都道府県</td>
            <td><input type="text" class="locctrl" id="prefctl" value="" maxlength="255"></td>
        </tr>
        <tr>
            <td>その他住所</td>
            <td><input type="text" class="locctrl" id="addrctl" value="" maxlength="255"></td>
        </tr>
    </table>
    <div>
        地図を右クリックして、住所を取得できます.<br />
        (You can get the address line when you right-click on map.)
    </div>
    <div id="map" style="position:relative;width:400px;height:300px;"> 
    </div>
    <p>
        <input type="button"
            id="btn1"
            value="Update address !" />
        <input type="button"
            id="btn0"
            value="Cancel" />
    </p>
    <p id="msgline" style="background-color:gray;">initializing ...</p>
</asp:Content>
