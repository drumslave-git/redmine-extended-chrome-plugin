let warn = document.getElementById('warn');

let miskReportURLButton = document.getElementById('miskReportURLButton');
let devReportURLButton = document.getElementById('devReportURLButton');
let spentTimeURLButton = document.getElementById('spentTimeURLButton');
let optionsUrl = document.getElementById('optionsUrl');

const checkboxsHolder = document.getElementById('checkboxsHolder');
const createCheckbox = (id, name) => {
    chrome.storage.sync.get(id, function(data) {
        const checked = !!data[id];

        const label = document.createElement('label');
        label.setAttribute('for', id);

        const input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('name', id);
        input.setAttribute('id', id);
        input.checked = checked;
        input.addEventListener('change', function (e) {
            chrome.storage.sync.set({ [e.target.name]: e.target.checked });
            showReloadWarn();
        });

        const a = document.createElement('a');
        a.classList.add('button');

        const active = document.createElement('span');
        active.classList.add('active');
        active.innerText = `${name}: ON`;

        const disabled = document.createElement('span');
        disabled.classList.add('disabled');
        disabled.innerText = `${name}: OFF`;

        a.append(active);
        a.append(disabled);
        label.append(input);
        label.append(a);
        checkboxsHolder.append(label);
    });
};

const checkboxs = {
    globalOn: 'GENERAL',
    changeFontSize: 'Change Font',
    useApi: 'Use API',
    convertTime: 'Convert Time',
    search: 'Search',
    exMenu: 'Ex. Menu',
    replaceIdWithTitle: 'Swap Issue Info',
    extendRoadMap: 'Extend Roadmap info',
    collapsibleRoadMap: 'Collapsible Roadmap',
};

Object.keys(checkboxs).forEach(id => createCheckbox(id, checkboxs[id]));

const showReloadWarn = () => {
    warn.innerHTML = 'Need to reload page';
};

const clearWarn = () => {
    warn.innerHTML = '';
};

chrome.storage.sync.get('miskReportURL', function(data) {
    miskReportURLButton.setAttribute(
        'href',
        data.miskReportURL
    );
    if(data.miskReportURL){
        miskReportURLButton.style.display = 'block';
    }
});

chrome.storage.sync.get('devReportURL', function(data) {
    devReportURLButton.setAttribute(
        'href',
        data.devReportURL
    );
    if(data.devReportURL){
        devReportURLButton.style.display = 'block';
    }
});

chrome.storage.sync.get('spentTimeURL', function(data) {
    spentTimeURLButton.setAttribute(
        'href',
        data.spentTimeURL
    );
    if(data.spentTimeURL){
        spentTimeURLButton.style.display = 'block';
    }
});

chrome.storage.sync.get(['descriptionCheck', 'descriptionMinLength'], function(data) {
    const id = 'descriptionCheck';
    const name = 'Description Check';
    const checked = !!data.descriptionCheck;
    const length = data.descriptionMinLength;

    const label = document.createElement('label');
    label.setAttribute('for', id);

    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('name', id);
    input.setAttribute('id', id);
    input.checked = checked;

    const a = document.createElement('a');
    a.classList.add('button');

    const active = document.createElement('span');
    active.classList.add('active');
    active.innerText = `${name}: ON`;

    const disabled = document.createElement('span');
    disabled.classList.add('disabled');
    disabled.innerText = `${name}: OFF`;

    const lengthInput = document.createElement('input');
    lengthInput.setAttribute('type', 'number');
    lengthInput.setAttribute('name', 'descriptionMinLength');
    lengthInput.setAttribute('placeholder', 'min length');
    lengthInput.value = length;

    if(!checked){
        lengthInput.style.display = 'none';
    }

    input.addEventListener('change', (e) => {
        chrome.storage.sync.set({ [e.target.name]: e.target.checked });
        if(!e.target.checked){
            lengthInput.style.display = 'none';
        }else{
            lengthInput.style.display = '';
        }
        showReloadWarn();
    });

    lengthInput.addEventListener('change', function (e) {
        const newLegnht = Number(e.target.value);
        chrome.storage.sync.set({ [e.target.name]: !isNaN(newLegnht) ? newLegnht : 0 });
        showReloadWarn();
    });

    a.append(active);
    a.append(disabled);
    label.append(input);
    label.append(a);
    checkboxsHolder.append(label);
    checkboxsHolder.append(lengthInput);
});

optionsUrl.addEventListener('click', function (e) {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
});
