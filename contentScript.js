chrome.storage.sync.get([
    'globalOn',
    'targetHost',
    'redmineApiKey',
    'changeFontSize',
    'scrollPositions',
    'useApi',
    'convertTime',
    'search',
    'exMenu',
    'descriptionCheck',
    'descriptionMinLength',
    'replaceIdWithTitle',
    'extendRoadMap',
    'collapsibleRoadMap',
    'todoExtended',
], function(data) {
    const {
        globalOn = true,
        redmineApiKey = null,
        targetHost = null,
        scrollPositions = {},
        changeFontSize = true,
        useApi = false,
        convertTime = false,
        search = false,
        exMenu = false,
        descriptionCheck = false,
        descriptionMinLength = 0,
        replaceIdWithTitle = false,
        extendRoadMap = false,
        collapsibleRoadMap = false,
        todoExtended = false,
    } = data;

    if(!globalOn){
        return;
    }
    if(!redmineApiKey){
        return;
    }
    if(!targetHost){
        return;
    }

    const baseUrl = `https://${targetHost}`;

    chrome.storage.local.get(['expandedIssues', 'expandedRoadmap'], function(localData) {
        const {
            expandedIssues = {},
            expandedRoadmap = {},
        } = localData;
        const re = new RedmineExtender({
            redmineApiKey,
            expandedIssues,
            expandedRoadmap,
            scrollPositions,
            changeFontSize,
            useApi,
            convertTime,
            search,
            exMenu,
            descriptionCheck,
            descriptionMinLength,
            replaceIdWithTitle,
            extendRoadMap,
            collapsibleRoadMap,
            todoExtended,
            chrome,
            baseUrl
        });

        re.init(() => {
            re.injectIssuesDom();
            re.injectParentsDom();
            re.injectRelationsDom();
            re.injectRemainingTime();
            re.injectDescriptionCheck();
            re.doReplaceIdWithTitle();
            re.injectExtendedRoadMapInfo();
            re.injectCollapsibleRoadMap();
            re.injectTODOExtended();
        })
    })
});
