const settings = {
    color: '#3aa757',
    miskReportURL: '',
    devReportURL: '',
    spentTimeURL: '',
    // expandedIssues: {},
    scrollPositions: {},
    changeFontSize: true,
    useApi: false,
    convertTime: false,
    globalOn: false,
    search: false,
    exMenu: false,
    descriptionCheck: false,
    descriptionMinLength: 0,
    replaceIdWithTitle: false,
    extendRoadMap: false,
    collapsibleRoadMap: false,
};

chrome.runtime.onInstalled.addListener(function() {

    Object.keys(settings).forEach(k => {
        chrome.storage.sync.get(k, function(data) {
            if (data[k] === undefined) {
                chrome.storage.sync.set({ [k]: settings[k] }, function () {
                    console.log("Setting " + k);
                });
            }
        });
    });

    chrome.storage.local.get('expandedIssues', function(data) {
        if (data.expandedIssues === undefined) {
            chrome.storage.local.set({ expandedIssues: {} }, function () {
                console.log("Setting expandedIssues");
            });
        }
    });

    chrome.storage.local.get('expandedRoadmap', function(data) {
        if (data.expandedRoadmap === undefined) {
            chrome.storage.local.set({ expandedRoadmap: {} }, function () {
                console.log("Setting expandedRoadmap");
            });
        }
    });
    chrome.storage.sync.get('targetHost', function(data) {
        chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
            chrome.declarativeContent.onPageChanged.addRules([{
                conditions: [new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: { hostEquals: data.targetHost },
                })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }]);
        });
    })
});
