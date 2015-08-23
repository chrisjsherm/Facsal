//Source: http://browser-update.org/
var $buoop = {
    vs:{i:10, f:30, o:22, s:5.1, c:35},
    reminder: 24,
    onshow: function (infos) {
        showNotification(infos);
    },
    onclick: function (infos) {
        clickOnNotification();
    },
    //text: "Your browser " + (this.browser) + " is out of date. Please update it.",
    url:"#",
    //test: true,
    newwindow: false
};
$buoop.ol = window.onload;
window.onload = function () {
    try { if ($buoop.ol) $buoop.ol(); } catch (e) { }
    var e = document.createElement("script");
    e.setAttribute("type", "text/javascript");
    e.setAttribute("src", "//browser-update.org/update.js");
    document.body.appendChild(e);
}


function clickOnNotification() {
    $('#buorg').hide().fadeOut();
}

function showNotification(infos) {
    var close_icon = "<div id='buorgclose'>×</div>";
    var message = "Your browser <b>(" + (infos.browser.t) + ")</b> is out of date. Please update it."+close_icon;
    //infos.text = mesage; no working
    console.log(infos);
    $('#buorg div').html(message);
}

