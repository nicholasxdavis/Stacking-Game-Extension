// URLs removed - no longer opening on install/uninstall
// const installUrl = "https://www.w3technic.com/chrome-extension/tiktok-stacking-blocks-challenge-game/#welcome";
// const uninstallUrl = "https://www.w3technic.com/chrome-extension/tiktok-stacking-blocks-challenge-game/#uninstall";


class ExtBackground {

    initialize() {
        // Removed: chrome.runtime.onInstalled.addListener - no longer opening URL on install
        // chrome.runtime.onInstalled.addListener(
        //     (details) => this.onInstalled(details));

        // Removed: chrome.runtime.setUninstallURL - no longer opening URL on uninstall
        // if (uninstallUrl) {
        //     chrome.runtime.setUninstallURL(uninstallUrl);
        // }
    }



    // Removed: onInstalled method - no longer opening URL on install
    // onInstalled(details) {
    //     if (details.reason == "install") {
    //         chrome.tabs.create({
    //             url: `${installUrl}`,
    //         });
    //     }
    // }
}



new ExtBackground().initialize();

//

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request.method)
    if (request.method == "runtimeID")
        sendResponse("ok");
});