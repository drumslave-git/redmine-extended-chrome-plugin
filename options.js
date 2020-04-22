let targetHost = document.getElementById('targetHost');
let redmineApiKey = document.getElementById('redmineApiKey');
let miskReportURLInput = document.getElementById('miskReportURLButton');
let devReportURLInput = document.getElementById('devReportURLButton');
let spentTimeURLInput = document.getElementById('spentTimeURLButton');
let save = document.getElementById('save');
let reset = document.getElementById('reset');

const saveTargetHost = () => {
    chrome.storage.sync.set({targetHost: targetHost.value}, function() {
        console.log("Setting targetHost");
    });
};
const saveRedmineApiKey = () => {
    chrome.storage.sync.set({redmineApiKey: redmineApiKey.value}, function() {
        console.log("Setting redmineApiKey");
    });
};
const saveMisk = () => {
    chrome.storage.sync.set({miskReportURL: miskReportURLInput.value}, function() {
        console.log("Setting miskReportURL");
    });
};
const saveDev = () => {
    chrome.storage.sync.set({devReportURL: devReportURLInput.value}, function() {
        console.log("Setting devReportURL");
    });
};
const saveSpentTime = () => {
    chrome.storage.sync.set({spentTimeURL: spentTimeURLInput.value}, function() {
        console.log("Setting spentTimeURLB");
    });
};
chrome.storage.sync.get('redmineApiKey', function(data) {
    if (data.redmineApiKey !== undefined) {
        redmineApiKey.value = data.redmineApiKey;
    }
});
chrome.storage.sync.get('miskReportURL', function(data) {
    if (data.miskReportURL !== undefined) {
        miskReportURLInput.value = data.miskReportURL;
    }
});
chrome.storage.sync.get('devReportURL', function(data) {
    if (data.devReportURL !== undefined) {
        devReportURLInput.value = data.devReportURL;
    }
});
chrome.storage.sync.get('spentTimeURL', function(data) {
    if (data.spentTimeURL !== undefined) {
        spentTimeURLInput.value = data.spentTimeURL;
    }
});

redmineApiKey.addEventListener('keypress', function () {
    saveRedmineApiKey();
});

miskReportURLInput.addEventListener('keypress', function () {
    saveMisk();
});

devReportURLInput.addEventListener('keypress', function () {
    saveDev();
});

spentTimeURLInput.addEventListener('keypress', function () {
    saveSpentTime()
});

save.addEventListener('click', function (e) {
    e.preventDefault();
    saveTargetHost();
    saveRedmineApiKey();
    saveMisk();
    saveDev();
    saveSpentTime();
    alert('SAVED')
});

const defaults = {
    color: '#3aa757',
    redmineApiKey: '',
    targetHost: '',
    miskReportURL: '',
    devReportURL: '',
    spentTimeURL: '',
    expandedIssues: {},
    scrollPositions: {},
    changeFontSize: true,
    useApi: false,
    convertTime: false,
    globalOn: false,
    search: false,
    exMenu: false,
};
reset.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.storage.sync.get(null, function(data) {
        chrome.storage.local.get(null, function (localData) {
            const resetData = {};
            Object.keys(data).forEach(k => {
                resetData[k] = defaults[k];
            });
            chrome.storage.sync.set(resetData, function () {
                const resetLocalData = {};
                Object.keys(localData).forEach(lk => {
                    resetLocalData[lk] = defaults[lk];
                });
                chrome.storage.local.set(resetLocalData, function () {
                    alert('DROPPED!');
                    window.location = window.location;
                })
            });
        });
    })
});
