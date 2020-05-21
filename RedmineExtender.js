class RedmineExtender {
    constructor(settings){
        let {
            chrome = null,
            redmineApiKey = null,
            expandedIssues = {},
            expandedRoadmap = {},
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
            searchBy = 'all',
            baseUrl = null,
            currentHref = null,
            addSubTicketUrl = '',
            currentIssueId = null,
            issues = [],
            parents = [],
            betterBottomControls = false,
            authenticityToken = '',
            totalRemainingHours = 0,
            totalRemainingHoursHolder = null,
        } = settings;

        this.redmineApiKey = redmineApiKey;
        this.chrome = chrome;
        this.expandedIssues = expandedIssues;
        this.expandedRoadmap = expandedRoadmap;
        this.scrollPositions = scrollPositions;
        this.changeFontSize = changeFontSize;
        this.useApi = useApi;
        this.convertTime = convertTime;
        this.search = search;
        this.exMenu = exMenu;
        this.descriptionCheck = descriptionCheck;
        this.descriptionMinLength = descriptionMinLength;
        this.replaceIdWithTitle = replaceIdWithTitle;
        this.extendRoadMap = extendRoadMap;
        this.collapsibleRoadMap = collapsibleRoadMap;
        this.todoExtended = todoExtended;
        this.searchBy = searchBy;
        this.baseUrl = baseUrl;
        this.currentHref = currentHref;
        this.issues = issues;
        this.parents = parents;
        this.addSubTicketUrl = addSubTicketUrl;
        this.currentIssueId = currentIssueId;
        this.betterBottomControls = betterBottomControls;
        this.authenticityToken = authenticityToken;
        this.totalRemainingHours = totalRemainingHours;
        this.totalRemainingHoursHolder = totalRemainingHoursHolder;

        this.tempStorage = {};
        this.asyncRequests = true;
        this.pool = {};

        this.saveExpandedIssuesDelay = null;
        this.saveExpandedRoadMapDelay = null;
        this.searchDelay = null;
    }

    httpGet(uri, callback = () => {}, url = null)
    {
        if(this.baseUrl) {
            const base = url ? url : this.baseUrl;
            if(this.pool[uri] === undefined || !uri){
                this.pool[uri] = null;
                const promise = new Promise((resolve, reject) => {
                    const xmlHttp = new XMLHttpRequest();
                    xmlHttp.open("GET", `${base}${uri}`, this.asyncRequests); // false for synchronous request
                    xmlHttp.setRequestHeader('X-CSRF-Token', this.authenticityToken);
                    xmlHttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    try{
                        xmlHttp.send(null);
                    }catch (e) {
                        reject(e);
                    }
                    if(this.asyncRequests) {
                        xmlHttp.onreadystatechange = function() {
                            if (this.readyState === 4 && this.status === 200 && this.responseText) {
                                if(!url) {
                                    resolve({data: JSON.parse(this.responseText), response: this});
                                }else{
                                    resolve({data: this.responseText, response: this});
                                }
                            }
                            if(this.status !== 200){
                                resolve({data: {}, response: this});
                            }
                        };
                    }else{
                        if(!url) {
                            resolve(JSON.parse(xmlHttp.responseText));
                        }else{
                            resolve(xmlHttp.responseText);
                        }
                    }
                });
                promise.then((r) => {
                    if(r.response.status !== 200){
                        this.toggleMessage(`<strong>${r.response.status} ${r.response.statusText}</strong> ${uri}`, 'error');
                    }
                    this.pool[uri] = r.data;
                    callback(r.data);
                });
                promise.catch(resp => {
                    console.warn(resp);
                    callback({});
                });
            }else{
                const promise = new Promise((resolve, reject) => {
                    const i = setInterval(() => {
                        if(this.pool[uri]){
                            clearInterval(i);
                            resolve(this.pool[uri]);
                        }
                    }, 1000)
                });
                promise.then(callback);
                promise.catch(resp => {
                    console.warn(resp);
                    callback({});
                });
            }
        }else {
            callback({});
        }
    }

    toggleMessage = (message, type) => {
        let extendedMessageNode = document.querySelector('.extendedMessage');
        if(extendedMessageNode) extendedMessageNode.remove();
        if(message) {
            extendedMessageNode = document.createElement('div');
            extendedMessageNode.classList.add('extendedMessage');
            if(type) {
                extendedMessageNode.classList.add(type);
            }
            extendedMessageNode.innerHTML = message;

            document.body.append(extendedMessageNode);

            setTimeout(() => {
                this.toggleMessage();
            }, 5000)
        }
    };

    getIssueData(id, callback = () => {})
    {
        const strId = id.toString();
        if(this.tempStorage[strId]){
            callback(this.tempStorage[strId]);
        }else {
            this.httpGet(`/issues/${strId}.json?include=relations&key=${this.redmineApiKey}`, ({ issue = {} }) => {
                this.tempStorage[strId] = issue;
                callback(issue);
            })
        }
    }

    saveExpandedIssues = () => {
        clearTimeout(this.saveExpandedIssuesDelay);
        if(!this.thead) {
            this.saveExpandedIssuesDelay = setTimeout(() => {
                this.expandedIssues[this.currentHref] = [];
                for ( let issue of this.issues ) {
                    if (issue.classList.contains('extendedExpanded')) {
                        let issueId = this.getIssueId(issue);
                        if (issueId) {
                            this.expandedIssues[this.currentHref].push(issueId);
                        }
                    }
                }

                this.chrome.storage.local.set({ expandedIssues: this.expandedIssues });
            }, 1000)
        }
    };

    saveExpandedRoadmap = () => {
        clearTimeout(this.saveExpandedRoadMapDelay);
        this.saveExpandedRoadMapDelay = setTimeout(() => {
            this.expandedRoadmap[this.currentHref] = [];
            const roadMapRelatedIssuesTablesNodes = document.querySelectorAll('#roadmap table.related-issues');
            for ( let roadMapRelatedIssuesTablesNode of roadMapRelatedIssuesTablesNodes ) {
                try{
                    const version = roadMapRelatedIssuesTablesNode.parentElement.parentElement.querySelector('h3.version a').name;
                    if(!roadMapRelatedIssuesTablesNode.querySelector('tbody').classList.contains('hidden')) {
                        this.expandedRoadmap[this.currentHref].push(version);
                    }
                } catch (e) {
                    continue;
                }
            }

            this.chrome.storage.local.set({ expandedRoadmap: this.expandedRoadmap });
        }, 1000)
    };

    saveScrollPosition = (erase) => {
        if (!erase) {
            this.scrollPositions[this.currentHref] = window.scrollY;
        } else {
            this.scrollPositions[this.currentHref] = null;
        }

        this.chrome.storage.sync.set({ scrollPositions: this.scrollPositions });
    };

    getIssueIdnt = (issue) => {
        let issueIdnt = 0;
        for ( let cls of issue.classList ) {
            if (cls.search('idnt-') >= 0) {
                issueIdnt = Number(cls.replace(/^\D+/g, ''));
                break;
            }
        }
        return issueIdnt;
    };

    getIssueId = (issue) => {
        let issueId = null;
        const chckbx = issue.querySelector('.checkbox input');
        if(chckbx && chckbx.value){
            issueId = chckbx.value;
        }
        return issueId;
    };

    calcLeftHours = (estimated = null, done = 0, total_estimated = null) => {
        let left = null;
        const estimation = total_estimated || estimated || null;
        if(estimation !== null) {
            left = (estimation - (estimation * (done / 100))).toFixed(2);
        }

        return left;
    };

    convertDecimalToHHMM = (decimal) => {
        let decimalTime = parseFloat(decimal);
        decimalTime = decimalTime * 60 * 60;
        let hours = Math.floor((decimalTime / (60 * 60)));
        decimalTime = decimalTime - (hours * 60 * 60);
        let minutes = Math.floor((decimalTime / 60));
        // decimalTime = decimalTime - (minutes * 60);
        // let seconds = Math.round(decimalTime);

        if(hours < 10)
        {
            hours = "0" + hours;
        }
        if(minutes < 10)
        {
            minutes = "0" + minutes;
        }

        return `${hours}h${minutes}min`;
    };

    renderProgressNode = (container, id) => {

        const wrapper = document.createElement('div');
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        const progressTextNode = document.createElement('div');

        table.setAttribute('id', id);

        wrapper.classList.add('extendedProgressWrapper');
        table.classList.add('progress');
        table.classList.add('extendedProgress');
        td1.classList.add('closed');
        td2.classList.add('todo');
        progressTextNode.classList.add('extendedProgressText');

        td1.append(progressTextNode);
        tr.append(td1);
        tr.append(td2);
        tbody.append(tr);
        table.append(tbody);
        wrapper.append(table);

        container.append(wrapper);
    };

    displayProgress = (node, current, total) => {
        if(node){
            const p = Number(current * 100 / total).toFixed(2);

            const td1 = node.querySelector('td.closed');
            const td2 = node.querySelector('td.todo');
            const progressTextNode = node.querySelector('.extendedProgressText');

            progressTextNode.innerText = `${p}%`;
            td1.style.width = `${p}%`;
            td2.style.width = `${100 - p}%`;
            if(td1.clientWidth > progressTextNode.clientWidth){
                progressTextNode.classList.add('visible');
            }

            if(current === total){

                setTimeout(() => {
                    node.classList.add('done');
                }, 3000)
            }
        }

    };

    checkDescription = (node, data) => {
        if(node && this.descriptionCheck){
            if(!data.description.length){
                node.classList.add('extendedNoDescription');
            }else if(data.description.length < this.descriptionMinLength){
                node.classList.add('extendedShortDescription');
            }
        }
    };

    getParentsPath(issueData, callback = () => {}, path = []) {
        const {parent: {id: parentId = null} = {}} = issueData;
        if(parentId !== null){
            this.getIssueData(parentId, (parentData) => {
                path.push({
                    subject: parentData.subject,
                    id: parentData.id
                });
                this.getParentsPath(parentData, callback, path);
            })
        }else{
            callback(path);
        }

    }

    getIssuesData = (issues, callback = () => {}, progressId = '') => {
        if(!this.useApi) return;
        const issuesCount = issues.length;
        const progressNode = document.getElementById(progressId);
        let resolvedIssuesCount = 0;

        const idsMap = {};
        const ids = [];
        for(let issue of issues){
            const issueId = this.getIssueId(issue);
            idsMap[this.getIssueId(issue)] = issue;
            ids.push(issueId);
        }

        this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);

        const limit = 100;
        const chunksNum = Math.ceil(ids.length / limit);
        for(let i = 0; i < chunksNum; i++) {
            const offset = i * limit;
            this.httpGet(`/issues.json?issue_id=${ids.slice(offset, offset + limit).join(',')}&limit=${limit}&status_id=*&include=relations&key=${this.redmineApiKey}`, ({ issues = [] }) => {
                for(let issueData of issues) {
                    const issue = idsMap[issueData.id];
                    resolvedIssuesCount += 1;
                    callback(issue, issueData);
                }
                this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);
            })
        }
    };

    getIssuesExtendedInfo = (issues, progressNode) => {
        if(!this.useApi) return;
        const issuesCount = issues.length;
        let resolvedIssuesCount = 0;

        this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);

        const idsMap = {};
        const ids = [];
        const parentsIDs = [];
        for(let issue of issues){
            const issueId = this.getIssueId(issue);
            idsMap[this.getIssueId(issue)] = issue;
            if(issue.classList.contains('parent')){
                parentsIDs.push(issueId);
            }else{
                ids.push(issueId);
            }
        }
        const limit = 100;
        const chunksNum = Math.ceil(ids.length / limit);
        for(let i = 0; i < chunksNum; i++) {
            const offset = i * limit;
            this.httpGet(`/issues.json?issue_id=${ids.slice(offset, offset + limit).join(',')}&limit=${limit}&status_id=*&include=relations&key=${this.redmineApiKey}`, ({issues = []}) => {
                for(let issueData of issues){
                    const issueDom = idsMap[issueData.id];
                    const { estimated_hours = null } = issueData;
                    const subjectNode = issueDom.querySelector('.subject');
                    const estimationTDNode = issueDom.querySelector('td.extendedEstimation');
                    const controlsNode = subjectNode.querySelector('.extendedControl .extendedControlWrapper');
                    if(!this.thead) {
                        if (estimated_hours !== null) {
                            if (this.convertTime) {
                                const decimal = Number(estimated_hours).toFixed(2);
                                estimationTDNode.innerHTML = `${this.convertDecimalToHHMM(decimal)} (${decimal})`;
                            } else {
                                estimationTDNode.innerHTML = Number(estimated_hours).toFixed(2);
                            }
                        }

                    }

                    this.injectRemainingTimeInfo(issueDom.querySelector('td.extendedRemaining'), issueData);
                    this.checkDescription(subjectNode, issueData);

                    resolvedIssuesCount += 0.5;
                    this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);

                    this.getParentsPath(issueData, (path = []) => {
                        this.injectParentsPath(controlsNode || subjectNode, path);
                        resolvedIssuesCount += 0.5;
                        this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);
                    });
                }
            });
        }

        for(let parentId of parentsIDs){
            const issueDom = idsMap[parentId];
            const subjectNode = issueDom.querySelector('.subject');
            const estimationTDNode = issueDom.querySelector('td.extendedEstimation');
            const controlsNode = subjectNode.querySelector('.extendedControl .extendedControlWrapper');

            this.getIssueData(parentId, (parentData) => {
                const { total_estimated_hours = null } = parentData;
                if(!this.thead) {
                    if (total_estimated_hours !== null) {
                        if (this.convertTime) {
                            const decimal = Number(total_estimated_hours).toFixed(2);
                            estimationTDNode.innerHTML = `${this.convertDecimalToHHMM(decimal)} (${decimal})`;
                        } else {
                            estimationTDNode.innerHTML = Number(total_estimated_hours).toFixed(2);
                        }
                    }
                }

                this.injectRemainingTimeInfo(issueDom.querySelector('td.extendedRemaining'), parentData);
                this.checkDescription(subjectNode, parentData);

                resolvedIssuesCount += 0.5;
                this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);

                // if(parentData.relations && parentData.relations.length){
                //     subjectNode.innerHTML = `(${parentData.relations.length}) ${subjectNode.innerHTML}`
                // }

                this.getParentsPath(parentData, (path = []) => {
                    this.injectParentsPath(controlsNode || subjectNode, path);

                    resolvedIssuesCount += 0.5;
                    this.displayProgress(progressNode, resolvedIssuesCount, issuesCount);
                });
            });
        }
    };

    getAndIterateChildren = (parent, firstLevel = true, callback = () => {}) => {
        const children = [];
        let issuesNotFound = true;
        const currentIdentClass = this.getIssueIdnt(parent);
        const childrenIdnt = currentIdentClass + 1;
        let issue = parent;
        while ( issuesNotFound && issue ) {
            issue = issue.nextElementSibling;
            if (issue) {
                let issueIdnt = 0;
                for ( let cls of issue.classList ) {
                    if (cls.search('idnt-') >= 0) {
                        issueIdnt = Number(cls.replace(/^\D+/g, ''));
                    }
                }
                if (issueIdnt === childrenIdnt && firstLevel) {
                    children.push(issue);
                    callback(issue, issueIdnt === childrenIdnt);
                } else if (issueIdnt >= childrenIdnt && !firstLevel) {
                    children.push(issue);
                    callback(issue, issueIdnt === childrenIdnt);
                } else {
                    if (issueIdnt < childrenIdnt) {
                        issuesNotFound = false;
                    }
                }
            }
        }

        return children;
    };

    getParent = (issue) => {
        let parent = issue;
        let issuesNotFound = true;
        const currentIdentClass = this.getIssueIdnt(parent);
        if (currentIdentClass === 0) {
            return null;
        }
        while ( issuesNotFound && parent ) {
            parent = parent.previousElementSibling;
            if (parent) {
                const issueIdnt = this.getIssueIdnt(parent);
                if (issueIdnt === currentIdentClass - 1) {
                    issuesNotFound = false;
                }
            }
        }
        return parent;
    };

    expandAllHandler = (e) => {
        e.preventDefault();
        const all = document.querySelectorAll('.extendedToggleLink');
        for ( let a of all ) {
            if (a.classList.contains('extendedToggleLinkToExpand')) {
                a.querySelector('img').click();
            }
        }
    };

    collapseAllHandler = (e) => {
        e.preventDefault();
        const all = document.querySelectorAll('.extendedToggleLink');
        for ( let a of all ) {
            if (!a.classList.contains('extendedToggleLinkToExpand')) {
                a.querySelector('img').click();
            }
        }
    };

    closePopup = () => {
        const popup = document.querySelector('.extendedPopupBG');
        if(popup){
            popup.remove();
        }
        const frame = document.getElementById('extendedFrame');
        if(frame){
            frame.remove();
        }
    };

    viewIssue = (e) => {
        e.preventDefault();

        this.closePopup();

        const href = e.target.href;

        const ajaxIndicator = document.getElementById('ajax-indicator');
        ajaxIndicator.style.display = 'block';

        const popupBg = document.createElement('div');
        const popup = document.createElement('div');
        const popupContent = document.createElement('div');
        const popupClose = document.createElement('div');

        popupBg.classList.add('extendedPopupBG');
        popup.classList.add('extendedPopup');
        popupContent.classList.add('extendedPopupContent');
        popupClose.classList.add('extendedPopupClose');

        popupClose.innerHTML = 'x';

        popupBg.addEventListener('click', () => {
            this.closePopup();
        });
        popupClose.addEventListener('click', () => {
            this.closePopup();
        });

        const frame = document.createElement('iframe');
        frame.setAttribute('id', 'extendedFrame');
        frame.style.display = 'none';
        document.body.appendChild(frame);

        frame.src = href;

        frame.onload = () => {
            const content = frame.contentDocument.body.querySelector('#content');
            if(content){
                content.style.width = '100%';
                content.style.boxSizing = 'border-box';
                popupContent.innerHTML = content.outerHTML;
            }
            frame.remove();
            ajaxIndicator.style.display = 'none';
        };

        popup.append(popupClose);
        popup.append(popupContent);
        popupBg.append(popup);

        document.body.append(popupBg);
    };

    doSearchByChange = e => {
        this.searchBy = e.target.value;
        this.doSearch();
    };

    doSearch = e => {
        clearTimeout(this.searchDelay);
        this.searchDelay = setTimeout(_=> {
            let v = '';
            if(e){
                v = e.target.value;
            }else{
                v = document.getElementById('extendedSearch').value
            }
            let notInvert = true;
            if(v && v[0] === '~') {
                notInvert = false;
                v = v.slice(1);
            }
            const q = new RegExp(v, 'i');

            for(let issue of this.issues){
                if(v === '') {
                    issue.style.display = '';
                    continue;
                }
                let found = false;
                const issueClone = issue.cloneNode(true);
                const extendedControl = issueClone.querySelector('.extendedControl');
                if(extendedControl) {
                    extendedControl.remove();
                }
                if(this.searchBy === 'all'){
                    found = issueClone.innerText.search(q) >= 0;
                }else{
                    try{
                        found = issueClone.querySelector(`td.${this.searchBy}`).innerText.search(q) >= 0;
                    }catch (e) {
                        found = false
                    }
                }
                if(found === notInvert){
                    issue.style.display = 'table-row';
                }else{
                    issue.style.display = 'none';
                }
            }
        }, 500);
    };

    injectParentsPath = (node, path) => {
        if(path.length && node) {
            const parentsNode = document.createElement('div');
            const subjects = [];
            parentsNode.classList.add('extendedParentsPath');
            for ( let item of path ) {
                const {id, subject} = item;
                if(!id || !subject) continue;
                const a = document.createElement('a');
                a.setAttribute('href', `/issues/${id}`);
                a.innerText = subject;
                subjects.push(subject);
                parentsNode.prepend(a);
            }
            if(node.classList.contains('subject')){
                node.setAttribute('title', subjects.reverse().join(' >> '));
            }else {
                node.prepend(parentsNode);
            }
        }
    };

    injectRemainingTimeInfo = (node, issueData = {}) => {
        const { total_estimated_hours = null, estimated_hours = null, done_ratio: done = 0 } = issueData;
        const left = this.calcLeftHours(estimated_hours, done, total_estimated_hours);
        if(left !== null && node) {
            this.totalRemainingHours += Number(left);
            if(this.convertTime){
                node.innerHTML = `${this.convertDecimalToHHMM(left)} (${left})`;
                if(this.totalRemainingHoursHolder) {
                    this.totalRemainingHoursHolder.innerHTML = `${this.convertDecimalToHHMM(this.totalRemainingHours)} (${this.totalRemainingHours.toFixed(2)})`;
                }
            }else {
                node.innerHTML = left;
                if(this.totalRemainingHoursHolder) {
                    this.totalRemainingHoursHolder.innerHTML = this.totalRemainingHours.toFixed(2);
                }
            }

        }
    };

    injectIssuesDom = (callback = () => {}) => {
        for ( let issue of this.issues ) {
            issue.classList.add('extendedIssue');
            if(this.descriptionCheck) {
                issue.classList.add('descriptionCheck');
            }
            const issueId = this.getIssueId(issue);
            const idnt = this.getIssueIdnt(issue);
            let issueEditLink = `/issues/${issueId}`;
            if (issue.classList.contains('child') && issue.classList.contains('idnt')) {
                if (!this.expandedIssues[this.currentHref] || !this.expandedIssues[this.currentHref].includes(issueId)) {
                    const parent = this.getParent(issue);
                    if (!parent || !parent.classList.contains('extendedExpanded')) {
                        issue.classList.add('extendedCollapsed');
                    } else if (parent.classList.contains('extendedExpanded')) {
                        const expandedChildren = [];
                        this.getAndIterateChildren(parent, true, (i) => {
                            if (i.classList.contains('extendedExpanded')) {
                                expandedChildren.push(i);
                            }
                        });
                        if (expandedChildren.length) {
                            issue.classList.add('extendedExpanded');
                        } else {
                            issue.classList.add('extendedCollapsed');
                        }
                    }
                } else {
                    issue.classList.add('extendedExpanded');
                }
            } else {
                issue.classList.add('extendedExpanded');
            }

            const subject = issue.querySelector('.subject');
            if (issue.classList.contains('parent')) {
                subject.style.paddingLeft = (idnt) * 20 + 'px';
            } else {
                subject.style.paddingLeft = (idnt) * 20 + 20 + 'px';
            }
            if (this.changeFontSize) {
                subject.style.fontSize = 12 + ((10 - idnt) / 2) + 'px';
                subject.style.opacity = 1 - idnt / 50;
            }

            if(this.descriptionCheck){
                const descriptionCheckResultNode = document.createElement('div');
                descriptionCheckResultNode.classList.add('extendedDescriptionCheckResult');
                subject.prepend(descriptionCheckResultNode);
            }

            if(this.exMenu) {
                const viewTicketNode = document.createElement("a");
                viewTicketNode.classList.add('extendedViewTicket');
                viewTicketNode.innerText = '[View]';
                const addSubTicketNode = document.createElement("a");
                addSubTicketNode.classList.add('extendedAddSubTicket');
                addSubTicketNode.innerText = '[Add here]';
                const issueEditLinkNode = document.createElement("a");
                issueEditLinkNode.classList.add('extendedIssueEditLink');
                issueEditLinkNode.innerText = '[Edit]';
                const issueFilterLinkNode = document.createElement("a");
                issueFilterLinkNode.classList.add('extendedIssueFilterLink');
                issueFilterLinkNode.innerText = '[Filter]';
                const controls = document.createElement("div");
                controls.classList.add('extendedControl');
                if (this.betterBottomControls) {
                    controls.classList.add('extendedBetterBottomControls');
                }
                const controlsActions = document.createElement("div");
                controlsActions.classList.add('extendedControlActions');
                const controlsInternalWrapper = document.createElement("div");
                controlsInternalWrapper.classList.add('extendedControlWrapper');

                viewTicketNode.setAttribute(
                    'href',
                    `/issues/${issueId}`
                );

                viewTicketNode.addEventListener('click', (e) => {
                    this.viewIssue(e);
                });

                addSubTicketNode.setAttribute(
                    'href',
                    this.addSubTicketUrl.replace(/(\[parent_issue_id\]=)(\d+)/g, `$1${issueId}`)
                );

                issueEditLink += '/edit';
                if (this.currentIssueId) {
                    issueEditLink += `?back_url=/issues/${this.currentIssueId}`
                }

                issueEditLinkNode.setAttribute(
                    'href',
                    issueEditLink
                );
                issueEditLinkNode.addEventListener('click', () => {
                    this.saveScrollPosition();
                });

                issueFilterLinkNode.setAttribute(
                    'href',
                    `/issues?set_filter=1&f[]=parent_id&op[parent_id]=~&v[parent_id][]=${issueId}`
                );


                controlsActions.append(viewTicketNode);
                controlsActions.append(issueEditLinkNode);
                controlsActions.append(addSubTicketNode);
                controlsActions.append(issueFilterLinkNode);
                controlsInternalWrapper.append(controlsActions);
                controls.append(controlsInternalWrapper);
                subject.append(controls);
            }

            if(this.useApi) {
                const doneTD = issue.querySelector('td.done_ratio');
                if(doneTD) {
                    if (!this.thead) {
                        const estimationTD = document.createElement('td');
                        estimationTD.classList.add('extendedEstimation');
                        estimationTD.setAttribute('title', '[Estimated time]');
                        issue.insertBefore(estimationTD, doneTD);
                    }

                    const remainingTD = document.createElement('td');
                    remainingTD.classList.add('extendedRemaining');
                    remainingTD.setAttribute('title', '[Remaining time]');
                    issue.insertBefore(remainingTD, doneTD);
                    if (this.thead && !document.querySelector('th.extendedRemainingTH')) {
                        const remainingTH = document.createElement('th');
                        remainingTH.classList.add('extendedRemainingTH');
                        remainingTH.setAttribute('title', '[Remaining time]');
                        remainingTH.innerText = '[Remaining time]';
                        const tds = Array.prototype.slice.call(issue.getElementsByTagName('td'));
                        const doneTDIdx = tds.indexOf(doneTD) - 1;
                        const doneTH = this.thead.getElementsByTagName('th')[doneTDIdx];
                        this.thead.querySelector('tr').insertBefore(remainingTH, doneTH);
                    }
                }
            }
        }

        setTimeout(() => {
            this.getIssuesExtendedInfo(this.issues, document.getElementById('extendedProgressSubtasks'));
            callback();
        }, 0)
    };

    injectParentsDom = (callback = () => {}) => {
        for ( let parent of this.parents ) {
            if (!parent) continue;
            parent.classList.add('extendedToggleableParent');
            const subject = parent.querySelector('.subject');
            if (!subject) continue;

            const toggleLink = document.createElement("a");

            const collapseImg = document.createElement("img");
            collapseImg.src = this.chrome.runtime.getURL("images/collapsed.png");
            collapseImg.classList.add('extendedCollapseImg');
            const expandImg = document.createElement("img");
            expandImg.src = this.chrome.runtime.getURL("images/expanded.png");
            expandImg.classList.add('extendedExpandeImg');

            toggleLink.append(collapseImg);
            toggleLink.append(expandImg);
            toggleLink.classList.add('extendedToggleLink');

            const collapsedChildren = [];
            this.getAndIterateChildren(parent, true, (issue) => {
                if (issue.classList.contains('extendedCollapsed')) {
                    collapsedChildren.push(issue);
                }
            });
            if (collapsedChildren.length) {
                toggleLink.classList.add('extendedToggleLinkToExpand');
            }

            toggleLink.setAttribute('href', '#');
            toggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                const toggleLinkNode = e.target.parentNode;
                let toExpand = toggleLinkNode.classList.contains('extendedToggleLinkToExpand');
                if (toExpand) {
                    toggleLinkNode.classList.remove('extendedToggleLinkToExpand');
                } else {
                    toggleLinkNode.classList.add('extendedToggleLinkToExpand');
                }
                this.getAndIterateChildren(parent, false, (issue, sameLevel) => {
                    if (sameLevel && toExpand) {
                        issue.classList.remove('extendedCollapsed');
                        issue.classList.add('extendedExpanded');
                    } else if (!toExpand) {
                        issue.classList.remove('extendedExpanded');
                        issue.classList.add('extendedCollapsed');
                        if (issue.classList.contains('extendedToggleableParent')) {
                            const issueToggleLink = issue.querySelector('.extendedToggleLink');
                            issueToggleLink.classList.add('extendedToggleLinkToExpand');
                        }
                    }
                });

                this.saveExpandedIssues();
            });

            subject.prepend(toggleLink);
        }

        setTimeout(() => {
            callback();
        }, 0)
    };

    injectRelationsDom = (callback = () => {}) => {
        const relations = document.getElementById('relations');
        if(relations){
            const relationsNode = document.querySelector('#relations > p > strong');
            const issues = relations.querySelectorAll('tr.issue');

            if(issues.length) {
                relationsNode.innerHTML = `${relationsNode.innerHTML} (${issues.length})`;

                this.renderProgressNode(relationsNode, 'extendedProgressRelations');
            }


            for(let issue of issues){
                issue.classList.add('extendedIssue');
                if(this.useApi) {
                    const doneTD = issue.querySelector('td.done_ratio');
                    const estimationTD = document.createElement('td');
                    estimationTD.classList.add('extendedEstimation');
                    issue.insertBefore(estimationTD, doneTD);
                }

                if(this.exMenu) {
                    const viewTicketNode = document.createElement("a");
                    viewTicketNode.classList.add('extendedViewTicket');
                    viewTicketNode.innerText = '[View]';
                    const controls = document.createElement("div");
                    controls.classList.add('extendedControl');
                    if (this.betterBottomControls) {
                        controls.classList.add('extendedBetterBottomControls');
                    }
                    const controlsActions = document.createElement("div");
                    controlsActions.classList.add('extendedControlActions');
                    const controlsInternalWrapper = document.createElement("div");
                    controlsInternalWrapper.classList.add('extendedControlWrapper');

                    const subject = issue.querySelector('.subject');

                    viewTicketNode.setAttribute(
                        'href',
                        subject.querySelector('a.issue').href
                    );

                    viewTicketNode.addEventListener('click', (e) => {
                        this.viewIssue(e);
                    });

                    controlsActions.append(viewTicketNode);
                    controlsInternalWrapper.append(controlsActions);
                    controls.append(controlsInternalWrapper);
                    subject.append(controls);
                }
            }

            setTimeout(() => {
                if(issues.length) {
                    this.getIssuesExtendedInfo(issues, document.getElementById('extendedProgressRelations'));
                }
                callback();
            }, 0)
        }else{
            callback();
        }
    };

    injectRemainingTime = () => {
        if(!this.useApi) return;
        const currentIssueTitleNode = document.querySelector('#content > .contextual + h2');
        const currentEstimationInfoNode = document.querySelector('.estimated-hours.attribute');

        if (currentIssueTitleNode && currentEstimationInfoNode) {
            const currentIssueTitleMatch = currentIssueTitleNode.innerText.match(/\d+/);
            if(currentIssueTitleMatch && currentIssueTitleMatch[0]) {
                const currentIssuesId = currentIssueTitleMatch[0];
                this.getIssueData(currentIssuesId, (issueData) => {
                    const { total_estimated_hours = null, estimated_hours = null, done_ratio: done = 0 } = issueData;
                    const left = this.calcLeftHours(estimated_hours, done, total_estimated_hours);
                    if(left !== null) {
                        const leftWrapper = document.createElement("div");
                        const labelNode = document.createElement("div");
                        const valueNode = document.createElement("div");

                        leftWrapper.classList.add('extended-left-time');
                        leftWrapper.classList.add('attribute');

                        labelNode.classList.add('label');
                        labelNode.innerHTML = '[Remaining time]';

                        valueNode.classList.add('value');
                        if(this.convertTime){
                            valueNode.innerHTML = `${this.convertDecimalToHHMM(left)} (${left})`;
                        }else {
                            valueNode.innerHTML = `${left} h`;
                        }

                        leftWrapper.append(labelNode);
                        leftWrapper.append(valueNode);

                        currentEstimationInfoNode.parentNode.insertBefore(leftWrapper, currentEstimationInfoNode);
                    }
                });
            }
        }
    };

    injectDescriptionCheck = () => {
        if(!this.checkDescription) return;
        const currentIssueTitleNode = document.querySelector('#content > .contextual + h2');
        if(!currentIssueTitleNode) return;

        let currentIssueId = null;

        const currentIssueTitleMatch = currentIssueTitleNode.innerText.match(/\d+/);
        if(currentIssueTitleMatch && currentIssueTitleMatch[0]) {
            currentIssueId = currentIssueTitleMatch[0];
        }else{
            return;
        }

        const descriptionNode = document.querySelector('.issue .description > p > strong');
        if(!descriptionNode) return;

        this.getIssueData(currentIssueId, (issueData) => {
            descriptionNode.innerHTML = `${descriptionNode.innerHTML} (Count of characters: ${issueData.description.length}, minimum: ${this.descriptionMinLength})`;
        });
    };

    injectSearch = (table) => {
        if(table.querySelector('thead') || !this.search) return;

        const tbody = table.querySelector('tbody');
        const tr = tbody.querySelector('tr.issue');
        const tds = tr.querySelectorAll('td');

        // let idx = 0;
        //
        // for(let td of tds){
        //     if(td.classList.contains('subject')){
        //         break;
        //     }
        //
        //     idx += 1;
        // }

        const thead = document.createElement('thead');
        const trh = document.createElement('tr');
        const th = document.createElement('th');
        const input = document.createElement('input');
        const select = document.createElement('select');
        const optionAll = document.createElement('option');
        th.setAttribute('colspan', tds.length);

        input.addEventListener('keyup', this.doSearch);
        input.setAttribute('id', 'extendedSearch');
        select.addEventListener('change', this.doSearchByChange);
        optionAll.setAttribute('value', 'all');
        optionAll.setAttribute('selected', 'selected');
        optionAll.innerText = 'All';

        select.append(optionAll);

        for(let td of tds){
            const text = td.innerText;

            if(text.trim()){
                const option = document.createElement('option');
                const value = td.classList.value;
                const label = value.replace('_', ' ');
                option.setAttribute('value', value);
                option.innerText = label;
                select.append(option);
            }
        }

        th.append(input);
        th.append(select);
        trh.append(th);
        thead.append(trh);

        table.insertBefore(thead, tbody);
    };

    doReplaceIdWithTitle = () => {
        if(!this.replaceIdWithTitle) return;
        const wikiNodes =  document.querySelectorAll('.wiki');
        for(let wikiNode of wikiNodes){
            const issueLinkNodes = wikiNode.querySelectorAll('a.issue');
            for(let issueLinkNode of issueLinkNodes){
                const title = issueLinkNode.getAttribute('title');
                const content = issueLinkNode.innerText;

                issueLinkNode.setAttribute('title', content);
                issueLinkNode.innerText = title;
            }
        }
    };

    injectExtendedRoadMapInfo = () => {
        const createTd = (className, innerContent, title = '') => {
            const td = document.createElement('td');
            td.setAttribute('title', title);
            td.classList.add(className);
            td.innerHTML = innerContent;
            return td;
        };
        if(this.extendRoadMap && this.useApi){
            const roadMapNode = document.getElementById('roadmap');

            if(roadMapNode){
                // const trEstimationNode = document.querySelector('.time-tracking table tr:first-of-type');
                // let estimationTime = '';
                // if(trEstimationNode){
                //     const tdEstimationPartsNode = trEstimationNode.querySelectorAll('.total-hours span');
                //     for(let tdEstimationPartNode of tdEstimationPartsNode){
                //         estimationTime += tdEstimationPartNode.innerText;
                //     }
                //
                //     estimationTime = Number(estimationTime);
                // }

                this.renderProgressNode(document.querySelector('#content h2'), 'extendedRoadmapProgress');

                const issueTrNodes = roadMapNode.querySelectorAll('table.related-issues tr');

                this.getIssuesData(issueTrNodes, (issueNode, issueData = {}) => {
                    const {total_estimated_hours = null, estimated_hours = null, done_ratio: done = 0, assigned_to = {name: ''}} = issueData;
                    const left = this.calcLeftHours(estimated_hours, done, total_estimated_hours);
                    const doneTd = createTd('extendedRoadmapDone', `
                        <table class="progress progress-4">
                            <tbody>
                                <tr>
                                    ${done > 0 ? `<td style="width: ${done}%;" class="closed" title="${done}%"></td>`: ''}
                                    <td style="width: ${100 - done}%;" class="todo"></td>
                                </tr>
                            </tbody>
                        </table>
                    `, '[Extended Done Ratio]');
                    const remainingTD = createTd('extendedRoadMapRemaining', left,'[Extended Remaining time]');
                    const assigneeTD = createTd('extendedRoadMapAssignee', assigned_to.name,'[Extended Assignee]');
                    issueNode.append(doneTd);
                    issueNode.append(remainingTD);
                    issueNode.append(assigneeTD);
                }, 'extendedRoadmapProgress')
            }
        }
    };

    injectCollapsibleRoadMap = () => {
        if(this.collapsibleRoadMap){
            const roadMapRelatedIssuesTablesNodes = document.querySelectorAll('#roadmap table.related-issues');

            if(roadMapRelatedIssuesTablesNodes && roadMapRelatedIssuesTablesNodes.length > 1){
                for(let roadMapRelatedIssuesTablesNode of roadMapRelatedIssuesTablesNodes){
                    const tbodyNode = roadMapRelatedIssuesTablesNode.querySelector('tbody');
                    if(tbodyNode){
                        tbodyNode.classList.add('collapsibleRoadMapTbody');

                        const captionNode = roadMapRelatedIssuesTablesNode.querySelector('caption');

                        let version = '';
                        try{
                            version = roadMapRelatedIssuesTablesNode.parentElement.parentElement.querySelector('h3.version a').name;
                        }catch (e) {
                            // Nothing
                        }

                        if (!this.expandedRoadmap[this.currentHref] || !this.expandedRoadmap[this.currentHref].includes(version)) {
                            tbodyNode.classList.add('hidden');
                        }else{
                            captionNode.classList.add('active')
                        }

                        captionNode.classList.add('collapsibleRoadMapCaption');
                        captionNode.addEventListener('click', (e) => {
                            tbodyNode.classList.toggle('hidden');
                            captionNode.classList.toggle('active');

                            this.saveExpandedRoadmap();
                        })
                    }
                }
            }
        }
    };

    injectTODOExtended = () => {
        if(this.todoExtended){
            function addInput(target) {
                const text = target.innerText;
                const newText = prompt("Edit comment", text);
                target.innerText = newText || '';
                const itemId = target.parentElement.id.match(/\d+/)[0];
                let issueId = target.parentElement.querySelector('td.id');
                issueId = issueId ? issueId.innerText : ''
                const order = [...document.querySelector('#issue-todo-list-table')
                    .querySelectorAll('tr[id|="issue"]')]
                    .map(tr => tr.id.match(/\d+$/)[0]);
                const fd = new FormData();
                fd.append('item[comment]', newText);
                fd.append('item[issue_id]', issueId);
                const token = document.querySelector('meta[name="csrf-token"]').content;
                fetch(`${location.href}/items/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-Token': token
                    }
                })
                .then(_ => {
                    return fetch(`${location.href}/items`,
                        {
                            method: 'POST',
                            headers: {
                                'X-CSRF-Token': token
                            },
                            body: fd
                        }
                    )
                })
                    .then(resp => {
                        resp.text().then(body => {
                            const items = body.match(/issue-todo-list-item-\d+/gm).map(id => id.match(/\d+/)[0]);
                            let newItemId = null;
                            for(const item of items){
                                if(order.indexOf(item) === -1){
                                    newItemId = item;
                                }
                            }
                            if(!newItemId){
                                return;
                            }
                            const fd = new FormData();
                            const newOrder = [...order];
                            newOrder.splice(order.indexOf(itemId), 1, newItemId);
                            newOrder.forEach(item => {
                                fd.append('item[]', item);
                            })
                            fetch(`${location.href}/update_item_order`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'X-CSRF-Token': token
                                    },
                                    body: fd
                                }).then(_ => {
                                    document.getElementById(`issue-todo-list-item-${itemId}`)
                                        .id = `issue-todo-list-item-${newItemId}`;
                                    const a = document.querySelector(`#issue-todo-list-item-${newItemId} a[href="items/${itemId}"]`);
                                    a.href = a.href.replace(/(\/items\/)(\d+)/, function (m, g1) {
                                        return `${g1}${newItemId}`;
                                    })
                            })
                        })
                    })
            }
            if(location.href.match(/\/issue_todo_lists\/\d+/)){
                document.querySelector('#issue-todo-list-table').addEventListener('dblclick', function (e) {
                    if(e.target.tagName.toLowerCase() === 'td'){
                        let parent = e.target.parentElement;
                        while(parent && parent.tagName.toLowerCase() !== 'tr'){
                            parent = parent.parentElement;
                        }

                        if(parent && parent.id.match(/^issue-.*\d+$/)){
                            if(
                                parent.querySelector(':scope > td.done_ratio + td') === e.target
                                ||
                                parent.querySelector(':scope > td[colspan]') === e.target
                            ){
                                e.preventDefault();
                                e.stopPropagation();
                                addInput(e.target);
                            }
                        }

                    }
                })
            }
        }
    };

    init = (callback = () => {}) => {
        const issue_tree = document.getElementById('issue_tree');
        let table;
        if(issue_tree){
            table = issue_tree.querySelector('table.list.issues');
        }else{
            table = document.querySelector('table.list.issues');

            const queryTotals = document.querySelector('.query-totals');
            if(queryTotals && this.useApi){
                const totalForEstimatedHours = queryTotals.querySelector('.total-for-estimated-hours');
                if(totalForEstimatedHours){
                    const span1 = document.createElement('span');
                    const span2 = document.createElement('span');
                    const span3 = document.createElement('span');
                    span1.classList.add('extendedTotalRemainingHours');
                    span3.classList.add('value');

                    span2.innerText = '[Remaining time]:';

                    span1.append(span2);
                    span1.append(span3);

                    queryTotals.insertBefore(span1, totalForEstimatedHours);

                    this.totalRemainingHoursHolder = document.querySelector('.extendedTotalRemainingHours .value');
                }
            }
        }

        if(this.useApi){
            const authInput = document.querySelector('input[name="authenticity_token"]');
            if(authInput){
                this.authenticityToken = authInput.value;
            }
        }
        if(table) {
            this.thead = table.querySelector('thead');
            if(this.thead){
                this.betterBottomControls = true;
            }
            this.parents = table.querySelectorAll('tr.parent');
            if(this.thead){
                const filteredParents = [];
                for(let parent of this.parents){
                    const parentIdnt = this.getIssueIdnt(parent);
                    const next = parent.nextElementSibling;
                    if(next){
                        const nextIdnt = this.getIssueIdnt(next);
                        if(nextIdnt > parentIdnt){
                            filteredParents.push(parent);
                        }
                    }
                }

                this.parents = filteredParents;
            }
            this.issues = table.querySelectorAll('tr.issue');
            this.currentHref = location.href.replace(/(http[s]?)|(#.*)/gm, '');

            let addSubTicketNode = document.querySelector('#issue_tree > .contextual a');
            if(!addSubTicketNode){
                addSubTicketNode = document.querySelector('#content > .contextual a');
            }
            if(addSubTicketNode) {
                this.addSubTicketUrl = decodeURIComponent(addSubTicketNode.href);
            }

            const expandAllNode = document.createElement('a');
            expandAllNode.href = '#';
            expandAllNode.innerHTML = '[Expand All]';
            expandAllNode.addEventListener('click', this.expandAllHandler);

            const collapseAllNode = document.createElement('a');
            collapseAllNode.href = '#';
            collapseAllNode.innerHTML = '[Collapse All]';
            collapseAllNode.addEventListener('click', this.collapseAllHandler);

            addSubTicketNode.parentNode.prepend(collapseAllNode);
            addSubTicketNode.parentNode.prepend(expandAllNode);

            let subtasksNode = document.querySelector('#issue_tree > p > strong');

            if(!subtasksNode){
                subtasksNode = document.querySelector('#content > .contextual + h2');
            }

            if(subtasksNode) {
                subtasksNode.innerHTML = `${subtasksNode.innerHTML} (${this.issues.length})`;
                if (this.useApi) {
                    this.renderProgressNode(subtasksNode, 'extendedProgressSubtasks');
                }
            }

            const currentIssueMatch = this.addSubTicketUrl.match(/(\[parent_issue_id\]=)(\d+)/);

            if (currentIssueMatch) {
                this.currentIssueId = currentIssueMatch[2];

                const currentIssueTitleNode = document.querySelector('#content > .contextual + h2');

                if (currentIssueTitleNode) {
                    const issueFilterLinkNode = document.createElement("a");
                    issueFilterLinkNode.classList.add('extendedIssueFilterLink');
                    issueFilterLinkNode.innerText = '[Filter]';
                    issueFilterLinkNode.setAttribute(
                        'href',
                        `/issues?set_filter=1&f[]=parent_id&op[parent_id]=~&v[parent_id][]=${this.currentIssueId}`
                    );

                    currentIssueTitleNode.append(issueFilterLinkNode);
                }
            }

            if(this.issues){
                this.injectSearch(table);
            }
        }
        setTimeout(() => {
            callback();
        }, 0)
    }
}
