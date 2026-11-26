const items = [...document.querySelectorAll(".menu-item")];

const screen = document.querySelector(".screen-content");
const menuHeader = document.querySelector(".menu-header");
const menuGrid = document.querySelector(".menu-grid");

let selected = 0;
let currentPage = "menu";

const page = document.createElement("div");
page.className = "device-page";
page.hidden = true;
screen.appendChild(page);

// Персонажі: вибір та імена зберігаються локально.
const companionCharacters = [
    { id: "chimp", species: "Шимпанзе", image: "chimp.png", available: true },
    { id: "goat", species: "Козел", image: null, available: false }
];
const companionStorageKey = "pocketdevice.characters.v1";

function loadCharacterSettings() {
    const defaults = { selected: "chimp", names: {} };
    try {
        const saved = JSON.parse(localStorage.getItem(companionStorageKey));
        if (!saved || typeof saved !== "object") return defaults;
        const selected = companionCharacters.find(
            character => character.id === saved.selected && character.available
        );
        const names = {};
        companionCharacters.forEach(character => {
            const name = saved.names && saved.names[character.id];
            if (typeof name === "string") names[character.id] = name.trim().slice(0, 24);
        });
        return { selected: selected ? selected.id : "chimp", names };
    } catch {
        return defaults;
    }
}

let characterSettings = loadCharacterSettings();
let characterCursor = 0;

function saveCharacterSettings() {
    try {
        localStorage.setItem(companionStorageKey, JSON.stringify(characterSettings));
        return true;
    } catch {
        return false;
    }
}

function activeCharacter() {
    return companionCharacters.find(character => character.id === characterSettings.selected)
        || companionCharacters[0];
}

function showCharacters() {
    page.innerHTML = `
        <div class="menu-header">Персонажі</div>
        <div class="character-list" aria-label="Вибір персонажа"></div>
        <form class="character-name-form">
            <label for="character-name">Ім'я кореша</label>
            <input id="character-name" maxlength="24" autocomplete="off"
                   placeholder="Введи ім'я" spellcheck="false">
            <button type="submit" class="character-save">Зберегти ім'я</button>
        </form>
        <p class="character-status" role="status" aria-live="polite"></p>
    `;

    characterCursor = Math.max(0, companionCharacters.findIndex(
        character => character.id === characterSettings.selected
    ));
    const list = page.querySelector(".character-list");
    const input = page.querySelector("#character-name");
    const status = page.querySelector(".character-status");

    companionCharacters.forEach((character, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "character-card";
        card.classList.toggle("unavailable", !character.available);
        card.innerHTML = `
            <div class="character-portrait"></div>
            <div class="character-info">
                <strong></strong>
                <span class="character-custom-name"></span>
                <span class="character-state"></span>
            </div>
        `;
        const portrait = card.querySelector(".character-portrait");
        if (character.image) {
            const img = document.createElement("img");
            img.src = character.image;
            img.alt = "";
            img.draggable = false;
            portrait.appendChild(img);
        } else {
            portrait.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M12 21L8 5H13L20 17H28L35 5H40L36 21
                    L42 24L36 30L31 39L24 45L17 39L12 30L6 24Z
                    M12 22H22V28H12Z M26 22H36V28H26Z M22 25H26
                    M20 35H28" />
            </svg>`;
        }
        card.querySelector("strong").textContent = character.species;
        card.addEventListener("click", () => {
            characterCursor = index;
            chooseCharacter();
        });
        list.appendChild(card);
    });

    input.value = characterSettings.names[activeCharacter().id] || "";
    page.querySelector(".character-name-form").addEventListener("submit", event => {
        event.preventDefault();
        const name = input.value.trim().slice(0, 24);
        characterSettings.names[activeCharacter().id] = name;
        input.value = name;
        const saved = saveCharacterSettings();
        renderCharacterCards();
        status.textContent = saved
            ? (name ? "Ім'я збережено." : "Ім'я скинуто.")
            : "Ім'я діє до закриття пристрою: сховище недоступне.";
    });

    renderCharacterCards();
}

function renderCharacterCards() {
    page.querySelectorAll(".character-card").forEach((card, index) => {
        const character = companionCharacters[index];
        const chosen = character.id === characterSettings.selected;
        card.classList.toggle("cursor", index === characterCursor);
        card.classList.toggle("chosen", chosen);
        card.setAttribute("aria-pressed", String(chosen));
        card.querySelector(".character-custom-name").textContent =
            characterSettings.names[character.id] || "";
        card.querySelector(".character-state").textContent =
            chosen ? "Обраний" : character.available ? "Обрати" : "Ще не доступний";
    });
}

function chooseCharacter() {
    const character = companionCharacters[characterCursor];
    const status = page.querySelector(".character-status");
    if (!character.available) {
        renderCharacterCards();
        status.textContent = "Цей кореш з'явиться в наступному оновленні.";
        return;
    }
    characterSettings.selected = character.id;
    const saved = saveCharacterSettings();
    page.querySelector("#character-name").value = characterSettings.names[character.id] || "";
    renderCharacterCards();
    status.textContent = saved ? "Кореш обраний." : "Обраний до закриття пристрою.";
}

function moveCharacterCursor(direction) {
    characterCursor = Math.max(0, Math.min(
        companionCharacters.length - 1, characterCursor + direction
    ));
    renderCharacterCards();
    page.querySelectorAll(".character-card")[characterCursor]?.scrollIntoView({ block: "nearest" });
}

// Записки: локальний органайзер, без сервера.
const notesStorageKey = "pocketdevice.notes.v1";
let notes = loadNotes();
let notesView = "list";
let notesQuery = "";
let notesCursor = 0;
let noteDraft = null;
let noteOriginal = null;
let noteQuestion = null;

function loadNotes() {
    try {
        const data = JSON.parse(localStorage.getItem(notesStorageKey));
        if (!Array.isArray(data)) return [];
        return data.filter(n => n && typeof n.id === "string" &&
            typeof n.title === "string" && typeof n.text === "string" &&
            Number.isFinite(n.created) && Number.isFinite(n.updated))
            .map(n => ({ id: n.id, title: n.title, text: n.text,
                created: n.created, updated: n.updated, pinned: !!n.pinned }));
    } catch { return []; }
}

function persistNotes(next) {
    try {
        localStorage.setItem(notesStorageKey, JSON.stringify(next));
        notes = next;
        return true;
    } catch { return false; }
}

function filteredNotes(query = notesQuery) {
    const term = query.trim().toLocaleLowerCase("uk");
    return notes.filter(n => !term ||
        (n.title + " " + n.text).toLocaleLowerCase("uk").includes(term))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated);
}

function noteDate(time) {
    return new Date(time).toLocaleDateString("uk-UA");
}

function notesControls() {
    return [...page.querySelectorAll("[data-note-nav]")].filter(
        element => !element.disabled && !element.closest("[hidden]")
    );
}

function notesHighlight(scroll = false) {
    const controls = notesControls();
    notesCursor = Math.max(0, Math.min(notesCursor, controls.length - 1));
    controls.forEach((element, i) => element.classList.toggle("note-cursor", i === notesCursor));
    if (scroll) controls[notesCursor]?.scrollIntoView({ block: "nearest" });
}

function bindNotesControls() {
    notesControls().forEach(element => {
        element.onfocus = () => {
            notesCursor = notesControls().indexOf(element);
            notesHighlight();
        };
    });
    notesHighlight();
}

function navigateNotes(direction) {
    if (page.contains(document.activeElement)) document.activeElement.blur();
    notesCursor += Math.sign(direction);
    notesHighlight(true);
}

function confirmNotes() {
    const element = notesControls()[notesCursor];
    if (!element) return;
    if (element.matches("input, textarea")) element.focus();
    else element.click();
}

function showNotesList(resetQuery = false) {
    if (resetQuery) notesQuery = "";
    notesView = "list";
    noteDraft = null;
    noteOriginal = null;
    noteQuestion = null;
    notesCursor = 0;
    page.innerHTML = `
        <div class="menu-header">Записки</div>
        <div class="notes-panel">
            <button class="note-btn note-new" data-note-nav>＋ Нова записка</button>
            <input class="note-field note-search" type="search" aria-label="Пошук записок"
                placeholder="Знайти записку..." data-note-nav autocomplete="off">
            <div class="note-list"></div>
            <footer class="notes-footer"><span class="note-count"></span><span>Локальна пам'ять</span></footer>
        </div>
    `;
    const search = page.querySelector(".note-search");
    search.value = notesQuery;
    search.addEventListener("input", () => {
        notesQuery = search.value;
        renderNotesList();
    });
    page.querySelector(".note-new").addEventListener("click", () => showNoteEditor());
    renderNotesList();
    screen.scrollTop = 0;
}

function renderNotesList() {
    const list = page.querySelector(".note-list");
    list.replaceChildren();
    const visible = filteredNotes();
    if (!visible.length) {
        const empty = document.createElement("p");
        empty.className = "note-empty";
        empty.textContent = notesQuery.trim() ? "Нічого не знайшлося." : "Поки пусто. Створи першу записку!";
        list.appendChild(empty);
    }
    visible.forEach(note => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "note-row";
        row.setAttribute("data-note-nav", "");
        row.innerHTML = `
            <span class="note-row-title">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1H13V15H3Z M5 5H11M5 8H11M5 11H9"/></svg>
                <strong></strong><span class="note-pin-mark" hidden>◆</span>
            </span>
            <span class="note-preview"></span>
            <span class="note-date"></span>
        `;
        row.querySelector("strong").textContent = note.title || "Без назви";
        row.querySelector(".note-preview").textContent = note.text.trim().replace(/\s+/g, " ") || "Порожня записка";
        row.querySelector(".note-date").textContent = noteDate(note.created);
        row.querySelector(".note-pin-mark").hidden = !note.pinned;
        row.querySelector(".note-pin-mark").title = "Закріплено";
        row.addEventListener("click", () => showNoteEditor(note.id));
        list.appendChild(row);
    });
    page.querySelector(".note-count").textContent = "Записок: " + String(notes.length).padStart(2, "0");
    bindNotesControls();
}

function showNoteEditor(id) {
    const existing = notes.find(n => n.id === id);
    const now = Date.now();
    noteDraft = existing ? { ...existing } : {
        id: now.toString(36) + "-" + Math.random().toString(36).slice(2, 10),
        title: "", text: "", created: now, updated: now, pinned: false
    };
    noteOriginal = { ...noteDraft };
    notesView = "edit";
    noteQuestion = null;
    notesCursor = 0;
    page.innerHTML = `
        <div class="menu-header"></div>
        <form class="note-editor">
            <label for="note-title">Заголовок</label>
            <input id="note-title" class="note-field" maxlength="120" placeholder="Назва записки" data-note-nav>
            <label for="note-text">Текст</label>
            <textarea id="note-text" class="note-field" maxlength="20000" rows="6" placeholder="Напиши щось..." data-note-nav></textarea>
            <div class="note-date editor-date"></div>
            <button type="button" class="note-btn note-pin" data-note-nav aria-pressed="false"></button>
            <button type="submit" class="note-btn note-save" data-note-nav>Зберегти</button>
            <div class="note-editor-actions">
                <button type="button" class="note-btn note-cancel" data-note-nav>Назад</button>
                <button type="button" class="note-btn note-delete" data-note-nav>Видалити</button>
            </div>
            <p class="note-status" role="status" aria-live="polite"></p>
        </form>
        <div class="note-question" hidden>
            <p></p>
            <button type="button" class="note-btn note-question-yes" data-note-nav>Так</button>
            <button type="button" class="note-btn note-question-no" data-note-nav>Ні</button>
        </div>
    `;
    page.querySelector(".menu-header").textContent = existing ? "Записка" : "Нова записка";
    const title = page.querySelector("#note-title");
    const body = page.querySelector("#note-text");
    title.value = noteDraft.title;
    body.value = noteDraft.text;
    title.addEventListener("input", () => noteDraft.title = title.value);
    body.addEventListener("input", () => noteDraft.text = body.value);
    page.querySelector(".editor-date").textContent = "Створено: " + noteDate(noteDraft.created);
    page.querySelector(".note-delete").hidden = !existing;
    page.querySelector(".note-pin").addEventListener("click", () => {
        noteDraft.pinned = !noteDraft.pinned;
        updateNotePin();
    });
    page.querySelector(".note-editor").addEventListener("submit", event => {
        event.preventDefault();
        saveNote();
    });
    page.querySelector(".note-cancel").addEventListener("click", backFromNotes);
    page.querySelector(".note-delete").addEventListener("click", () => askNoteQuestion("delete"));
    page.querySelector(".note-question-yes").addEventListener("click", resolveNoteQuestion);
    page.querySelector(".note-question-no").addEventListener("click", closeNoteQuestion);
    updateNotePin();
    bindNotesControls();
    screen.scrollTop = 0;
}

function updateNotePin() {
    const pin = page.querySelector(".note-pin");
    pin.textContent = noteDraft.pinned ? "◆ Відкріпити" : "◇ Закріпити";
    pin.setAttribute("aria-pressed", String(noteDraft.pinned));
}

function saveNote() {
    noteDraft.title = page.querySelector("#note-title").value.trim();
    noteDraft.text = page.querySelector("#note-text").value;
    if (!noteDraft.title && !noteDraft.text.trim()) {
        page.querySelector(".note-status").textContent = "Напиши хоча б щось.";
        return;
    }
    const note = { ...noteDraft, updated: Date.now() };
    const next = [note, ...notes.filter(n => n.id !== note.id)];
    if (!persistNotes(next)) {
        page.querySelector(".note-status").textContent = "Не вдалося зберегти. Можливо, пам'ять заповнена.";
        return;
    }
    showNotesList(true);
}

function askNoteQuestion(kind) {
    noteQuestion = kind;
    page.querySelector(".note-editor").hidden = true;
    const question = page.querySelector(".note-question");
    question.hidden = false;
    question.querySelector("p").textContent = kind === "delete"
        ? "Видалити записку назавжди?" : "Вийти без збереження?";
    notesCursor = 1; // Безпечна відповідь «Ні» вибрана першою.
    bindNotesControls();
}

function closeNoteQuestion() {
    noteQuestion = null;
    page.querySelector(".note-question").hidden = true;
    page.querySelector(".note-editor").hidden = false;
    notesCursor = 0;
    bindNotesControls();
}

function resolveNoteQuestion() {
    if (noteQuestion === "delete") {
        const next = notes.filter(n => n.id !== noteDraft.id);
        if (!persistNotes(next)) {
            closeNoteQuestion();
            page.querySelector(".note-status").textContent = "Не вдалося видалити записку.";
            return;
        }
    }
    showNotesList(true);
}

function backFromNotes() {
    if (noteQuestion) { closeNoteQuestion(); return true; }
    if (notesView !== "edit") return false;
    const changed = noteDraft.title !== noteOriginal.title ||
        noteDraft.text !== noteOriginal.text || noteDraft.pinned !== noteOriginal.pinned;
    if (changed) askNoteQuestion("discard");
    else showNotesList();
    return true;
}

const builtInArticles = [
  {
    "id": "bleeding",
    "category": "aid",
    "title": "Зупинка сильної кровотечі",
    "text": "1. Переконайся, що місце безпечне. Виклич 103 або 112. По можливості одягни рукавички.\n\n2. Сильно притисни рану марлею або чистою тканиною. Не відпускай тиск, щоб перевірити рану.\n\n3. За небезпечної для життя кровотечі з руки чи ноги, яку не зупиняє прямий тиск, застосуй сертифікований турнікет згідно з інструкцією або вказівками диспетчера. Запиши час накладання. Самостійно не послаблюй його.\n\n4. Укрий постраждалого, залишайся поруч до прибуття медиків.",
    "sources": [
      {
        "label": "МОЗ України: базові правила",
        "url": "https://moz.gov.ua/uk/moz-nagadue-bazovi-pravila-domedichnoi-dopomogi"
      }
    ]
  },
  {
    "id": "burns",
    "category": "aid",
    "title": "Термічні опіки",
    "text": "1. Припини контакт із джерелом тепла, якщо це безпечно. Зніми прикраси й вільний одяг поблизу опіку, не відривай прилиплу тканину.\n\n2. Охолоджуй опік прохолодною проточною водою близько 20 хвилин. Захисти решту тіла від переохолодження.\n\n3. Накрий чистою неворсистою пов’язкою, не тисни. Не використовуй лід, олію, креми та не проколюй пухирі.\n\n4. При великому, глибокому опіку, ураженні обличчя або дихальних шляхів, електричному чи хімічному опіку потрібна невідкладна медична допомога: 103.",
    "sources": [
      {
        "label": "МОЗ України: термічні опіки",
        "url": "https://moz.gov.ua/article/health/domedichna-dopomoga-pri-termichnih-opikah--"
      }
    ]
  },
  {
    "id": "fracture",
    "category": "aid",
    "title": "Переломи кінцівок",
    "text": "1. Не змушуй людину рухати травмованою кінцівкою. При сильному болю, деформації чи відкритій рані виклич 103.\n\n2. Зупини кровотечу. Не вправляй кістку, не випрямляй кінцівку насильно.\n\n3. Підтримай кінцівку у знайденому положенні, уникаючи зайвих рухів. Фіксацію шиною виконуй, якщо маєш навички.\n\n4. Укрий людину та контролюй її стан до допомоги.",
    "sources": [
      {
        "label": "МОЗ України: переломи",
        "url": "https://moz.gov.ua/uk/domedichna-dopomoga-u-razi-perelomiv-kincivok"
      }
    ]
  },
  {
    "id": "cpr",
    "category": "aid",
    "title": "Реанімація дорослого (СЛР)",
    "text": "1. Переконайся у безпеці. Якщо людина не реагує, виклич 103 або 112, увімкни гучний зв’язок.\n\n2. Перевір дихання. Якщо воно відсутнє або ненормальне (поодинокі судомні вдихи), почни СЛР.\n\n3. На твердій поверхні натискай на середину грудної клітки випрямленими руками: 100–120 разів за хвилину, глибина 5–6 см, давай грудній клітці повністю розправлятися.\n\n4. Якщо навчений і можеш, роби 30 натискань і 2 вдихи. Інакше продовжуй безперервні натискання. Якщо доступний AED, увімкни його й виконуй голосові підказки.\n\n5. Продовжуй до прибуття медиків, появи нормального дихання, виснаження або небезпеки. Для дітей і немовлят алгоритм має відмінності.",
    "sources": [
      {
        "label": "ERC 2025: Adult Basic Life Support",
        "url": "https://www.erc.edu/media/wrhj5sye/gl2025-04-bls-e.pdf"
      }
    ]
  },
  {
    "id": "choking",
    "category": "aid",
    "title": "Удавлення стороннім предметом",
    "text": "Алгоритм для дорослого.\n\n1. Якщо людина може голосно кашляти, заохочуй кашель і спостерігай.\n\n2. Якщо не може говорити, дихати чи ефективно кашляти, виклич 103/112. Нахили її вперед і нанеси до 5 ударів долонею між лопатками.\n\n3. Якщо не допомогло, зроби до 5 поштовхів у живіт вище пупка та нижче грудини, всередину й угору. Чергуй серії по 5. Для вагітних або людей, яких неможливо охопити за талію, використовують поштовхи в грудну клітку.\n\n4. При втраті свідомості починай СЛР. Не шукай предмет пальцями наосліп. Навіть після успішних поштовхів потрібен медичний огляд. Для немовлят — інший алгоритм.",
    "sources": [
      {
        "label": "Resuscitation Council UK, 2025",
        "url": "https://www.resus.org.uk/sites/default/files/2025-10/Adult%20choking%20algorithm%202025%20.pdf"
      }
    ]
  },
  {
    "id": "cold",
    "category": "aid",
    "title": "Переохолодження",
    "text": "1. Перемісти людину в захищене тепле місце, якщо безпечно. При сплутаній свідомості, сильній сонливості чи ненормальному диханні виклич 103.\n\n2. Обережно заміни мокрий одяг сухим, укрий ковдрою, захисти від холодної землі та вітру.\n\n3. Тепле безалкогольне пиття — лише якщо людина при свідомості та нормально ковтає. Не розтирай шкіру і не використовуй дуже гарячу воду.\n\n4. Контролюй дихання, за потреби виконуй вказівки диспетчера щодо СЛР.",
    "sources": [
      {
        "label": "МОЗ України: переохолодження",
        "url": "https://moz.gov.ua/article/health/pereoholodzhennja-scho-ce-take-jak-jogo-viznachiti-ta-jak-nadati-domedichnu-dopomogu-postrazhdalomu"
      }
    ]
  },
  {
    "id": "fire",
    "category": "survival",
    "title": "Як розвести багаття",
    "text": "Розводь вогонь лише там, де це дозволено і немає мінної небезпеки. Не роби цього під час заборони, посухи чи сильного вітру.\n\n1. Використай облаштоване місце для багаття; прибери легкозаймисті матеріали поруч. Мати воду для гасіння обов’язково.\n\n2. Підготуй сухий трут, тонкі гілочки та трохи більші дрова. Запали трут сірником, додавай гілки поступово. Не застосовуй бензин чи спирт для розпалювання.\n\n3. Не залишай вогонь без нагляду. Перед виходом залий водою, перемішай попіл і повтори до повного охолодження.",
    "sources": [
      {
        "label": "NPS: підготовка до походу",
        "url": "https://www.nps.gov/articles/10essentials.htm"
      },
      {
        "label": "NPS: гасіння багаття",
        "url": "https://www.nps.gov/voya/learn/news/2026-08-24-campfire-restrictions-lifted.htm"
      }
    ]
  },
  {
    "id": "water",
    "category": "survival",
    "title": "Як знезаразити воду",
    "text": "1. Найкраще взяти запечатану питну воду. Якщо немає — знайди джерело без ознак хімічного забруднення.\n\n2. Каламутну воду відстій або пропусти через чисту тканину. Доведи до активного кипіння й підтримуй 1 хвилину (вище 2000 м — 3 хвилини).\n\n3. Дай охолонути, зберігай у чистій закритій ємності.\n\nВажливо: кип’ятіння не усуває паливо, токсичні хімікати чи радіоактивні домішки. Таку воду не пий.",
    "sources": [
      {
        "label": "CDC: безпечна вода",
        "url": "https://www.cdc.gov/water-emergency/about/"
      }
    ]
  },
  {
    "id": "shelter",
    "category": "survival",
    "title": "Тимчасове укриття від негоди",
    "text": "1. Обери безпечне сухе місце, вище рівня можливого підтоплення, подалі від нестійких дерев та скель. Не виходь на невідомі чи заміновані території.\n\n2. Натягни тент на надійних опорах з ухилом для стоку дощу. Залиш провітрювання.\n\n3. Ізолюйся від землі карематом або сухими матеріалами. Запасний одяг і термоковдра знижують втрати тепла.\n\nНе використовуй багаття чи паливний обігрівач у закритому укритті.",
    "sources": [
      {
        "label": "NPS: Ten Essentials",
        "url": "https://www.nps.gov/articles/10essentials.htm"
      }
    ]
  },
  {
    "id": "knots",
    "category": "survival",
    "title": "Базові вузли",
    "text": "Прямий вузол: зв’яжи кінці мотузки — правий над лівим, потім лівий над правим. Підходить для нетривалого зв’язування, не для страхування.\n\nВісімка: зроби петлю; вільний кінець обведи навколо основної частини, потім пропусти крізь петлю й затягни.\n\nБулинь утворює незатяжну петлю. Перед практичним використанням вивчи схему з джерела та потренуйся. Не застосовуй ці текстові інструкції для альпінізму, підвішування людей або рятувальних робіт.",
    "sources": [
      {
        "label": "Scouting America: Basic Knots",
        "url": "https://troopleader.scouting.org/rank-advancement-skills/campcraft/basic-knots/"
      }
    ]
  },
  {
    "id": "map",
    "category": "orientation",
    "title": "Як читати карту",
    "text": "1. Перевір масштаб та позначення. Наприклад, 1:25 000 означає 250 м на місцевості на 1 см карти.\n\n2. Знайди північ і помітні орієнтири: дороги, водойми, будівлі.\n\n3. Поверни карту відповідно до місцевості. Зістав щонайменше два орієнтири, перш ніж визначити напрямок.\n\n4. Зауваж, що паперова й офлайн-карта можуть застаріти. Уникай заборонених та небезпечних ділянок.",
    "sources": [
      {
        "label": "NPS: навігація",
        "url": "https://www.nps.gov/articles/10essentials.htm"
      }
    ]
  },
  {
    "id": "compass",
    "category": "orientation",
    "title": "Як користуватися компасом",
    "text": "1. Тримай компас горизонтально, подалі від металу та електроніки. Дочекайся, поки стрілка зупиниться.\n\n2. Північний кінець стрілки вказує на магнітну північ. Для точного перенесення напрямку між картою і компасом врахуй магнітне схилення.\n\n3. Обери орієнтир у потрібному напрямку, рухайся до нього й періодично перевіряй курс.\n\nПотренуйся в знайомій місцевості заздалегідь.",
    "sources": [
      {
        "label": "NPS: навігація",
        "url": "https://www.nps.gov/articles/10essentials.htm"
      }
    ]
  },
  {
    "id": "lost",
    "category": "orientation",
    "title": "Що робити, якщо заблукав",
    "text": "1. Зупинись, заспокойся, оціни стан і запас води. Не йди навмання.\n\n2. Спробуй визначити місце за картою або GPS. Повертайся знайомою дорогою тільки якщо точно знаєш, що вона безпечна.\n\n3. Якщо не можеш знайти шлях, зв’яжись із 112 або 101, повідом орієнтири та координати. Залишайся на безпечному видимому місці.\n\n4. Економ заряд, використовуй свисток і яскраві речі для сигналів. Бережи тепло.",
    "sources": [
      {
        "label": "NPS: Outdoor Emergency Plan",
        "url": "https://www.nps.gov/articles/gtgemergencyplan.htm"
      }
    ]
  },
  {
    "id": "shut-water",
    "category": "home",
    "title": "Як перекрити воду",
    "text": "1. Знайди запірні крани холодної та гарячої води біля входу труб у квартиру чи біля лічильників.\n\n2. Для більшості кульових кранів ручка поперек труби означає закрито. Гвинтовий кран зазвичай закривається обертанням за годинниковою стрілкою. Не докладай надмірної сили.\n\n3. Відкрий змішувач, аби перевірити припинення подачі. При затопленні та небезпеці від електрики не торкайся мокрих приладів; виклич відповідну аварійну службу.",
    "sources": [
      {
        "label": "ДСНС: безпека у побуті",
        "url": "https://bezpeka.dsns.gov.ua/materials/bezpeka-v-umovakh-viyny"
      }
    ]
  },
  {
    "id": "tools",
    "category": "home",
    "title": "Базові інструменти",
    "text": "Мінімальний набір: викрутки під різні шліци, пасатижі, розвідний ключ, рулетка, рівень, ліхтарик, захисні окуляри й рукавички.\n\nПідбирай інструмент під розмір кріплення. Оглядай його перед роботою. Не використовуй пошкоджений інструмент.\n\nДля електрики, газу та несучих конструкцій звертайся до кваліфікованих фахівців.",
    "sources": []
  },
  {
    "id": "repair",
    "category": "home",
    "title": "Дрібний побутовий ремонт",
    "text": "1. Перед роботою визнач причину проблеми.\n\n2. Для ослабленого меблевого кріплення підбери відповідну викрутку, акуратно підтягни гвинт. Не перетягуй.\n\n3. Пошкоджене кріплення або деталь заміни на сумісну.\n\nНе самостійно ремонтуй газові прилади, електромережу під напругою або конструкції, що можуть обвалитися.",
    "sources": []
  },
  {
    "id": "housefire",
    "category": "safety",
    "title": "Пожежа в приміщенні",
    "text": "1. Попередь інших, негайно виходь безпечним маршрутом. Не користуйся ліфтом. У задимленні тримайся низько.\n\n2. Закривай двері за собою, якщо це можливо. Не повертайся по речі.\n\n3. З безпечного місця телефонуй 101 або 112. Назви адресу, поверх, що горить та чи є люди всередині.\n\n4. Якщо вихід заблокований, закрий двері, ущільни щілини, виклич рятувальників і сигналізуй з вікна. Не стрибай. Не гаси водою електроприлади під напругою чи палаючу олію.",
    "sources": [
      {
        "label": "ДСНС: пожежна безпека",
        "url": "https://bezpeka.dsns.gov.ua/materials/pozhezhna-bezpeka"
      }
    ]
  },
  {
    "id": "gas",
    "category": "safety",
    "title": "Запах газу",
    "text": "1. Не вмикай і не вимикай світло чи прилади, не користуйся телефоном у загазованому приміщенні, не запалюй вогонь.\n\n2. Якщо це безпечно, перекрий газ, відчини вікна вручну, вийди з будівлі.\n\n3. Попередь людей без електричних дзвінків. З надвору набери 104 або 112. Не повертайся, поки фахівці не дозволять.",
    "sources": [
      {
        "label": "ДСНС: витік газу",
        "url": "https://bezpeka.dsns.gov.ua/materials/zapakh-hazu-shcho-robyty-v-razi-yoho-vytoku"
      }
    ]
  },
  {
    "id": "blackout",
    "category": "safety",
    "title": "Відключення світла",
    "text": "1. Підготуй ліхтарики, павербанк, воду й їжу, яка не потребує приготування. Не відкривай холодильник без потреби.\n\n2. Від’єднай чутливі прилади від мережі, залиш одну лампу як індикатор відновлення живлення.\n\n3. Генератор працює лише надворі, подалі від вікон і вентиляції. Не використовуй вугільні грилі чи газову плиту для обігріву житла.\n\n4. Не підключай генератор саморобним кабелем до розетки. Для підключення до мережі потрібен електрик.",
    "sources": [
      {
        "label": "ДСНС: побут при відключеннях",
        "url": "https://bezpeka.dsns.gov.ua/materials/yak-bezpechno-pryhotuvaty-abo-rozihrity-yizhu-koly-nemaie-svitla"
      }
    ]
  },
  {
    "id": "alert",
    "category": "safety",
    "title": "Повітряна тривога",
    "text": "1. Одразу прямуй до найближчого придатного укриття. Не використовуй ліфт.\n\n2. Якщо дістатися укриття неможливо, залишайся подалі від вікон, у внутрішній частині будівлі за двома стінами. Це тимчасовий варіант, не заміна укриття.\n\n3. Слідкуй за офіційними повідомленнями, залишай укриття після відбою.\n\nПри влучанні чи пожежі евакуюйся безпечним шляхом, телефонуй 101. Не торкайся уламків та підозрілих предметів.",
    "sources": [
      {
        "label": "ДСНС: повітряна тривога",
        "url": "https://bezpeka.dsns.gov.ua/materials/pravyla-povedinky-pid-chas-povitryanoyi-tryvohy"
      }
    ]
  },
  {
    "id": "bag",
    "category": "safety",
    "title": "Тривожна валіза",
    "text": "Заздалегідь підготуй рюкзак.\n\n• Документи та їх копії, готівка, ключі.\n• Вода, їжа тривалого зберігання, аптечка та особисті ліки.\n• Заряджений телефон, павербанк, ліхтарик, батарейки, свисток.\n• Теплий одяг, гігієнічні засоби, термоковдра.\n• Паперові контакти близьких і план маршруту до укриття.\n\nПеревіряй терміни придатності та заряд батарей.",
    "sources": [
      {
        "label": "ДСНС: тривожна валіза",
        "url": "https://bezpeka.dsns.gov.ua/materials/shcho-varto-poklasty-u-tryvozhnu-valizu"
      }
    ]
  },
  {
    "id": "emergency",
    "category": "safety",
    "title": "Куди дзвонити в екстреній ситуації",
    "text": "101 — рятувальники та пожежна служба.\n102 — поліція.\n103 — екстрена медична допомога.\n104 — аварійна газова служба.\n112 — єдиний номер екстреної допомоги.\n\nНазви місце, що сталось, кількість постраждалих та небезпеки. Відповідай на запитання диспетчера, не клади слухавку, поки він не завершить розмову.",
    "sources": [
      {
        "label": "ДСНС: екстрені служби",
        "url": "https://bezpeka.dsns.gov.ua/contacts"
      }
    ]
  },
  {
    "id": "jokes",
    "category": "psychology",
    "title": "Анекдоти",
    "text": "1. — Ти зранку бігаєш?\n— Так. Від будильника до кнопки «ще п'ять хвилин».\n\n2. — Чого холодильник відкриваєш кожні десять хвилин?\n— Чекаю оновлення асортименту.\n\n3. — Я вирішив стати організованою людиною.\n— І як?\n— Записав це в список справ. Список загубив.\n\n4. — Як ремонт?\n— Купив нову рулетку. Тепер точно знаю, скільки всього ще не зроблено.\n\n5. — Чого ти не взяв парасолю?\n— Бо прогноз обіцяв сонце.\n— І?\n— Сонце, мабуть, взяло вихідний.\n\n6. — Скільки тобі треба грошей для щастя?\n— Не знаю. Давай експериментально визначимо.\n\n7. — Ти чого такий серйозний?\n— Намагаюсь згадати, навіщо зайшов у цю кімнату.\n\n8. — Як називається людина, яка прокидається рано без будильника?\n— Сусід з перфоратором.\n\n9. — Мені треба навчитися економити.\n— І з чого почнеш?\n— Куплю книжку про економію. Зі знижкою.\n\n10. — Ти ж казав, що сьогодні все зробиш!\n— Я не уточнював, до якого року.\n\n11. — Де мій телефон?\n— У тебе в руці.\n— Бля, добре замаскувався.\n\n12. — Чого ти з компасом по квартирі ходиш?\n— Шукаю напрямок у житті.\n\n13. — Ти зарядився?\n— Морально — ні. А батарея нормальна.\n\n14. — Чого ти знову в кепці?\n— Голова сьогодні працює в закритому режимі.\n\n15. — Я нарешті знайшов баланс між роботою і відпочинком.\n— Який?\n— Сиджу й думаю, що з цього почати.\n\n16. — У нас є план Б?\n— Є.\n— Який?\n— Дізнатися, чому не було плану А.\n\n17. — Скільки часу займає твоя ранкова зарядка?\n— Залежить від того, як швидко телефон зарядиться.\n\n18. — Ти вмієш готувати?\n— Та. Вмію точно визначати, коли вже пора замовляти їжу.",
    "sources": []
  },
  {
    "id": "moonshine",
    "category": "science",
    "title": "Самогон: бродіння і дистиляція",
    "text": "Наукова довідка. Самогон — міцний спиртний напій, який отримують перегонкою рідини після спиртового бродіння.\n\n1. Бродіння: дріжджі перетворюють доступні цукри на етанол і вуглекислий газ.\n\n2. Дистиляція: компоненти суміші мають різну леткість. Парова фаза має інший склад, ніж початкова рідина; під час охолодження вона конденсується. Цей принцип використовують у хімічних лабораторіях і промисловості.\n\n3. Контроль якості: аналіз концентрацій та домішок здійснюють відповідним лабораторним обладнанням. Запах і смак не гарантують відсутності токсичних речовин.\n\nРизики: легкозаймисті пари, небезпечний тиск, опіки та отруєння. В Україні стаття 176 КУпАП передбачає штраф за домашнє виготовлення чи зберігання самогону без мети збуту та відповідних апаратів. Це пояснення процесу, не домашня інструкція з виготовлення алкоголю.",
    "sources": [
      {
        "label": "OpenStax: дистиляція",
        "url": "https://openstax.org/books/chemistry/pages/11-4-colligative-properties"
      },
      {
        "label": "OpenStax: бродіння",
        "url": "https://openstax.org/books/microbiology/pages/8-4-fermentation"
      },
      {
        "label": "КУпАП, ст. 176, Уповноважений ВРУ",
        "url": "https://npm.ombudsman.gov.ua/wp-content/uploads/2026/02/kodeks-ukrayiny-pro-administratyvni-pravoporushennya.pdf"
      }
    ]
  },
  {
    "id": "dnr",
    "category": "history",
    "title": "Очерки истории Донецкой Народной Республики",
    "text": "Монографія 2024 року, за редакцією Л. Г. Шепко, В. В. Разумного, А. В. Колесника. ISBN 978-5-00244-546-2.\n\nОгляд змісту: автори описують функціонування самопроголошеної «ДНР» у 2014–2022 роках. Теми включають її політичні інституції, відносини з РФ, культурну політику, освіту й історичну пам’ять. Книга представляє погляд авторів із підконтрольних Росії установ і використовує російську офіційну інтерпретацію подій.\n\nІсторичний контекст: у 2014 році збройні угруповання захопили органи влади на території Донецької та Луганської областей України. Самопроголошені утворення не були міжнародно визнаними державами. У 2022 році РФ оголосила про анексію частин України; Генеральна Асамблея ООН засудила її в резолюції ES-11/4.\n\nЦе стислий критичний огляд, не відтворення книги. Для дослідження порівнюй її з незалежними джерелами та офіційними документами.",
    "sources": [
      {
        "label": "Бібліографічний запис",
        "url": "https://elib.wkau.kz/ru/poisk-po-elektronnomw-katalogw/?e_kls=%D0%94%D0%9E%D0%9D&e_sort=alf_desc&e_viewdb=LANN"
      },
      {
        "label": "ООН: доповідь про окупацію, 2024",
        "url": "https://ukraine.un.org/sites/default/files/2024-04/2024-03-20%20OHCHR%20Report%20on%20Occupation%20and%20Aftermath%20%281%29_0.pdf"
      },
      {
        "label": "ООН: резолюція ES-11/4",
        "url": "https://digitallibrary.un.org/record/3990673/files/A_RES_ES-11_4-EN.pdf"
      }
    ]
  }
];

// Чтиво — локальні статті та власні матеріали.
const libraryCategories = [
    ["aid", "Перша допомога", "M6 1H10V6H15V10H10V15H6V10H1V6H6Z"],
    ["survival", "Виживання", "M8 1L13 7L15 11L12 15H4L1 11L5 5L6 10Z"],
    ["home", "Побут та ремонт", "M1 2L5 1L7 5L15 13L13 15L5 7L1 6Z"],
    ["orientation", "Орієнтування", "M8 1L15 8L8 15L1 8Z M5 11L7 7L11 5L9 9Z"],
    ["safety", "Безпека", "M8 1L14 4V10L8 15L2 10V4Z M8 5V9M8 11V12"],
    ["books", "З книжок", "M1 2H6L8 4L10 2H15V13H10L8 15L6 13H1Z M8 4V15"],
    ["favorites", "Обране", "M8 1L10 6H15L11 9L13 15L8 12L3 15L5 9L1 6H6Z"],
    ["custom", "Мої матеріали", "M1 4H6L8 6H15V14H1Z"]
];
const bookCategories = [
    ["philosophy", "Філософія"], ["psychology", "Психологія"],
    ["science", "Наука"], ["literature", "Художня література"], ["history", "Історія"]
];
const readingStorageKey = "pocketdevice.library.v1";
const readingDefaults = () => ({ favorites: [], custom: [], fontSize: 14 });
function loadReadingData() {
    try {
        const saved = JSON.parse(localStorage.getItem(readingStorageKey));
        if (!saved || typeof saved !== "object") return readingDefaults();
        return {
            favorites: Array.isArray(saved.favorites) ? saved.favorites.filter(x => typeof x === "string") : [],
            custom: Array.isArray(saved.custom) ? saved.custom.filter(a => a && typeof a.id === "string" &&
                typeof a.title === "string" && typeof a.text === "string" && typeof a.category === "string")
                .map(a => ({id:a.id, title:a.title, text:a.text, category:a.category, sources:[], custom:true})) : [],
            fontSize: Math.max(12, Math.min(22, Number(saved.fontSize) || 14))
        };
    } catch { return readingDefaults(); }
}
let readingData = loadReadingData();
let libraryState = { view:"home" };
let libraryTrail = [];
let libraryCursor = 0;
let libraryDraft = null;
let libraryOriginal = null;

function saveReadingData(next) {
    try {
        localStorage.setItem(readingStorageKey, JSON.stringify(next));
        readingData = next;
        return true;
    } catch { return false; }
}
function allArticles() { return [...builtInArticles, ...readingData.custom]; }
function categoryName(id) {
    return [...libraryCategories, ...bookCategories].find(x => x[0] === id)?.[1] || "Мої матеріали";
}
function libraryArticles(category, query = "") {
    const term = query.trim().toLocaleLowerCase("uk");
    return allArticles().filter(a => (
        category === "favorites" ? readingData.favorites.includes(a.id) :
        category === "custom" ? !!a.custom :
        category === "all" ? true :
        category === "books" ? bookCategories.some(c=>c[0]===a.category) :
        a.category === category
    ) && (!term || (a.title + " " + a.text).toLocaleLowerCase("uk").includes(term)));
}
function libControls() { return [...page.querySelectorAll("[data-lib-nav]")].filter(e=>!e.disabled&&!e.closest("[hidden]")); }
function highlightLibrary(scroll = false) {
    const controls = libControls();
    libraryCursor = Math.max(0, Math.min(libraryCursor, controls.length-1));
    controls.forEach((e,i)=>e.classList.toggle("note-cursor",i===libraryCursor));
    if(scroll) controls[libraryCursor]?.scrollIntoView({block:"nearest"});
}
function bindLibraryControls() {
    libControls().forEach(e => e.onfocus = () => { libraryCursor = libControls().indexOf(e); highlightLibrary(); });
    highlightLibrary();
}
function moveLibrary(direction) {
    if(libraryState.view === "article" && Math.abs(direction)===3) {
        screen.scrollBy({top:Math.sign(direction)*130,behavior:"smooth"}); return;
    }
    if(page.contains(document.activeElement)) document.activeElement.blur();
    libraryCursor+=Math.sign(direction);highlightLibrary(true);
}
function confirmLibrary() {
    const e=libControls()[libraryCursor];if(!e)return;
    if(e.matches("input:not([type=file]), textarea, select"))e.focus();else e.click();
}
function openLibrary() {
    libraryTrail=[]; libraryState={view:"home",query:""}; libraryDraft=null; renderLibrary();
}
function libraryGo(state) {
    libraryTrail.push({...libraryState}); libraryState=state;renderLibrary();
}
function libraryBack() {
    if(libraryState.view==="editor" && libraryDraft && JSON.stringify(libraryDraft)!==JSON.stringify(libraryOriginal)) {
        if(!window.confirm("Вийти без збереження матеріалу?"))return true;
    }
    if(!libraryTrail.length)return false;
    libraryState=libraryTrail.pop();libraryDraft=null;renderLibrary();return true;
}
function libraryButton(label, onClick, cls="note-btn") {
    const b=document.createElement("button");b.type="button";b.className=cls;b.textContent=label;
    b.setAttribute("data-lib-nav","");b.addEventListener("click",onClick);return b;
}
function libraryStatus(message) { const e=page.querySelector(".library-status");if(e)e.textContent=message; }
function libraryRows(target, articles) {
    if(!articles.length) {
        const p=document.createElement("p");p.className="note-empty";p.textContent="Поки нічого немає.";target.appendChild(p);return;
    }
    articles.forEach(a=>{
        const b=libraryButton("",()=>libraryGo({view:"article",id:a.id}),"library-row");
        const name=document.createElement("strong");name.textContent=a.title;
        const info=document.createElement("span");info.className="note-date";
        info.textContent=(readingData.favorites.includes(a.id)?"★ ":"")+categoryName(a.category)+(a.custom?" · Власний":"");
        b.appendChild(name);b.appendChild(info);target.appendChild(b);
    });
}
function libraryCategoryRow(target, category) {
    const [id,name,path]=category;
    const b=libraryButton("",()=>libraryGo({view:id==="books"?"books":"category",category:id,query:""}),"library-category");
    if(path) b.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="'+path+'"/></svg>';
    const title=document.createElement("span");title.textContent=name;b.appendChild(title);
    const count=document.createElement("span");count.className="library-category-count";
    count.textContent=String(libraryArticles(id).length).padStart(2,"0")+" ›";b.appendChild(count);target.appendChild(b);
}
function renderLibrary() {
    libraryCursor=0;
    page.innerHTML='<div class="menu-header">Чтиво</div><div class="library-panel"></div>';
    const panel=page.querySelector(".library-panel");
    const view=libraryState.view;
    if(view==="home"||view==="category"||view==="books"){
        if(view!=="home") {
            page.querySelector(".menu-header").textContent=categoryName(libraryState.category);
            panel.appendChild(libraryButton("‹ Назад",()=>libraryBack()));
        }
        const input=document.createElement("input");input.className="note-field note-search";
        input.type="search";input.placeholder="Пошук...";input.setAttribute("aria-label","Пошук матеріалів");
        input.setAttribute("data-lib-nav","");input.value=libraryState.query||"";
        panel.appendChild(input);
        if(view==="category"&&libraryState.category==="custom")panel.appendChild(libraryButton("＋ Новий матеріал",()=>libraryGo({view:"editor"}),"note-btn note-new"));
        const list=document.createElement("div");list.className="library-list";panel.appendChild(list);
        function refresh(){
            list.replaceChildren();
            const q=input.value;libraryState.query=q;
            if(!q.trim()&&view==="home")libraryCategories.forEach(c=>libraryCategoryRow(list,c));
            else if(!q.trim()&&view==="books")bookCategories.forEach(c=>libraryCategoryRow(list,c));
            else libraryRows(list,libraryArticles(view==="home"?"all":libraryState.category,q));
            bindLibraryControls();
        }
        input.addEventListener("input",refresh);refresh();
    } else if(view==="article") {
        const a=allArticles().find(x=>x.id===libraryState.id);
        if(!a){libraryBack();return;}
        const meta=document.createElement("div");meta.className="note-date";meta.textContent=categoryName(a.category)+(a.custom?" · Власний матеріал":" · Офлайн-довідка");
        panel.appendChild(meta);
        const title=document.createElement("h2");title.className="library-title";title.textContent=a.title;panel.appendChild(title);
        const tools=document.createElement("div");tools.className="library-toolbar";panel.appendChild(tools);
        const text=document.createElement("div");text.className="library-article-text";text.textContent=a.text;
        text.style.fontSize=readingData.fontSize+"px";
        function font(delta){const fontSize=Math.max(12,Math.min(22,readingData.fontSize+delta));if(saveReadingData({...readingData,fontSize}))text.style.fontSize=fontSize+"px";else libraryStatus("Не вдалося зберегти налаштування.");}
        tools.appendChild(libraryButton("A−",()=>font(-1)));
        tools.appendChild(libraryButton("A+",()=>font(1)));
        const star=libraryButton(readingData.favorites.includes(a.id)?"★ В обраному":"☆ В обране",()=>{
            const favorites=readingData.favorites.includes(a.id)?readingData.favorites.filter(x=>x!==a.id):[...readingData.favorites,a.id];
            if(saveReadingData({...readingData,favorites}))star.textContent=favorites.includes(a.id)?"★ В обраному":"☆ В обране";
            else libraryStatus("Не вдалося зберегти обране.");
        }); tools.appendChild(star);
        panel.appendChild(text);
        if(a.category==="aid"&&!a.custom){
            const warning=document.createElement("p");warning.className="library-warning";
            warning.textContent="Довідка не замінює навчання домедичної допомоги. У разі надзвичайної ситуації звертайся до 103 або 112 та виконуй вказівки диспетчера.";panel.appendChild(warning);
        }
        if(a.sources?.length){
            const label=document.createElement("div");label.className="note-date";label.textContent="Джерела (потребують інтернету):";panel.appendChild(label);
            a.sources.forEach(s=>{const link=document.createElement("a");link.className="library-source";link.textContent=s.label;link.href=s.url;link.target="_blank";link.rel="noopener noreferrer";link.setAttribute("data-lib-nav","");panel.appendChild(link);});
        }else if(!a.custom){
            const label=document.createElement("div");label.className="note-date";label.textContent="Оригінальна довідка PocketDevice";panel.appendChild(label);
        }
        if(a.custom){
            panel.appendChild(libraryButton("Редагувати",()=>libraryGo({view:"editor",id:a.id})));
            panel.appendChild(libraryButton("Видалити",()=>{
                if(!window.confirm("Видалити цей матеріал назавжди?"))return;
                const next={...readingData,custom:readingData.custom.filter(x=>x.id!==a.id),favorites:readingData.favorites.filter(x=>x!==a.id)};
                if(saveReadingData(next))libraryBack();else libraryStatus("Не вдалося видалити.");
            }));
        }
        panel.appendChild(libraryButton("‹ Назад",()=>libraryBack()));
    } else if(view==="editor") {
        page.querySelector(".menu-header").textContent="Мій матеріал";
        const existing=readingData.custom.find(a=>a.id===libraryState.id);
        libraryDraft=existing?{...existing}:{id:"user-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9),title:"",text:"",category:"custom",sources:[],custom:true};
        libraryOriginal={...libraryDraft};
        panel.innerHTML=`<form class="note-editor library-editor">
            <label for="lib-title">Назва</label><input id="lib-title" class="note-field" maxlength="150" data-lib-nav>
            <label for="lib-category">Категорія</label><select id="lib-category" class="note-field" data-lib-nav></select>
            <label for="lib-text">Текст</label><textarea id="lib-text" class="note-field" maxlength="200000" rows="8" data-lib-nav></textarea>
            <input type="file" accept=".txt,text/plain" id="lib-import" hidden>
            <button type="button" class="note-btn" id="lib-import-button" data-lib-nav>Імпорт .txt</button>
            <button type="submit" class="note-btn note-save" data-lib-nav>Зберегти</button>
            <button type="button" class="note-btn" id="lib-cancel" data-lib-nav>‹ Назад</button>
        </form>`;
        const form=panel.querySelector("form"), title=panel.querySelector("#lib-title"), body=panel.querySelector("#lib-text"), category=panel.querySelector("#lib-category");
        [["custom","Мої матеріали"],...libraryCategories.filter(c=>!["custom","books","favorites"].includes(c[0])),...bookCategories].forEach(([id,name])=>{const o=document.createElement("option");o.value=id;o.textContent=name;category.appendChild(o);});
        title.value=libraryDraft.title;body.value=libraryDraft.text;category.value=libraryDraft.category;
        function readDraft(){libraryDraft.title=title.value;libraryDraft.text=body.value;libraryDraft.category=category.value;}
        form.addEventListener("input",readDraft);form.addEventListener("change",readDraft);
        panel.querySelector("#lib-cancel").addEventListener("click",()=>libraryBack());
        const fileInput=panel.querySelector("#lib-import");
        panel.querySelector("#lib-import-button").addEventListener("click",()=>fileInput.click());
        fileInput.addEventListener("change",async()=>{
            const f=fileInput.files?.[0];if(!f)return;
            if(!/\.txt$/i.test(f.name)||f.size>500000){libraryStatus("Обери .txt до 500 КБ.");return;}
            try{
                const draftId=libraryDraft.id, imported=await f.text();
                if(currentPage!=="library"||libraryState.view!=="editor"||libraryDraft.id!==draftId)return;
                if(imported.length>200000){libraryStatus("Забагато тексту. Максимум 200 000 символів.");return;}
                if(body.value.trim()&&!window.confirm("Замінити поточний текст вмістом файлу?"))return;
                body.value=imported;if(!title.value.trim())title.value=f.name.replace(/\.txt$/i,"").slice(0,150);readDraft();libraryStatus("Файл імпортовано. Натисни «Зберегти».");
            }catch{libraryStatus("Не вдалося прочитати файл.");}
            finally{fileInput.value="";}
        });
        form.addEventListener("submit",event=>{
            event.preventDefault();readDraft();
            const article={...libraryDraft,title:libraryDraft.title.trim(),text:libraryDraft.text.trim()};
            if(!article.title||!article.text){libraryStatus("Додай назву і текст.");return;}
            if(!saveReadingData({...readingData,custom:[article,...readingData.custom.filter(x=>x.id!==article.id)]})){libraryStatus("Не вдалося зберегти. Можливо, пам’ять заповнена.");return;}
            libraryDraft=null;libraryBack();
        });
    }
    const status=document.createElement("p");status.className="note-status library-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");panel.appendChild(status);
    bindLibraryControls();screen.scrollTop=0;
}

// Карта — локальний векторний шар, без GPS, мережі та API-ключів.
const mapCategories = {
    all: ["Усі", "•", "#65e8d6"],
    med: ["Лікарні", "+", "#a0f7e6"],
    pharm: ["Аптеки", "А", "#8bdfae"],
    police: ["Поліція", "П", "#91c9fa"],
    fire: ["ДСНС", "Д", "#ffbd87"],
    shelter: ["Укриття", "У", "#f1dd83"]
};
const mapState = {x: 2900, y: 4050, zoom: .85, category: "all", mode: "map", selected: -1, cursor: 0, query: ""};
const mapNS = "http://www.w3.org/2000/svg";
function mapSVG(tag, attrs = {}, contents = "") {
    const el = document.createElementNS(mapNS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (contents) el.textContent = contents;
    return el;
}
function mapVisiblePoints() {
    const text = mapState.query.trim().toLowerCase();
    return pocketMapData.points.map((p,i) => ({...p,i})).filter(p =>
        (mapState.category === "all" || mapState.category === p.cat) &&
        (!text || (p.name + " " + p.address).toLowerCase().includes(text)));
}
function mapFrame() {
    const w = 5700 / mapState.zoom, h = w * .75;
    return {w,h,x:mapState.x-w/2,y:mapState.y-h/2};
}
function mapClamp() {
    mapState.x = Math.max(0,Math.min(pocketMapData.bounds[0],mapState.x));
    mapState.y = Math.max(0,Math.min(pocketMapData.bounds[1],mapState.y));
}
function mapZoom(delta) {
    mapState.zoom = Math.max(.75,Math.min(12,mapState.zoom * delta));
    renderMapView();
}
function mapSelect(index, center = false) {
    const p = pocketMapData.points[index];
    if (!p) return;
    mapState.selected = index;
    if (center && p.xy) {
        [mapState.x,mapState.y] = p.xy;
        mapState.zoom = Math.max(4,mapState.zoom);
        mapState.query = "";
        page.querySelector(".map-search").value = "";
        mapState.mode = "map";
    }
    renderMapUI();
}
function mapShowDetails() {
    const detail = page.querySelector(".map-detail");
    if (!detail) return;
    detail.replaceChildren();
    const p = pocketMapData.points[mapState.selected];
    if (!p) { detail.hidden = true; return; }
    detail.hidden = false;
    const heading = document.createElement("strong");
    heading.textContent = p.name;
    const address = document.createElement("div");
    address.textContent = p.address ? p.address : "Адресу в джерелі не вказано";
    const note = document.createElement("small");
    note.textContent = p.cat === "shelter" ?
        (p.xy ? "Точка будівлі за адресою, не точний вхід. Доступ перевіряй завчасно." : "Є в переліку міськради. Координат немає; на карті не позначено.") :
        "Дані карти, не інформація про роботу закладу зараз.";
    const close = document.createElement("button");
    close.type = "button"; close.className = "map-close"; close.textContent = "×"; close.setAttribute("aria-label","Закрити");
    close.onclick = () => {mapState.selected = -1; renderMapUI();};
    detail.append(heading,close,address,note);
}
function renderMapView() {
    const svg = page.querySelector(".map-svg");
    if (!svg) return;
    const box = mapFrame();
    svg.setAttribute("viewBox", [box.x,box.y,box.w,box.h].join(" "));
    const scale = box.w/400;
    const legend = page.querySelector(".map-scale");
    legend.textContent = "≈ " + Math.round(scale*80) + " м";
    const markerGroup = svg.querySelector(".map-markers");
    const labelGroup = svg.querySelector(".map-labels");
    markerGroup.replaceChildren(); labelGroup.replaceChildren();
    const inView = (x,y) => x >= box.x-50 && x <= box.x+box.w+50 && y >= box.y-50 && y <= box.y+box.h+50;
    const occupied = [];
    if (mapState.zoom >= 1.8) {
        for (const [name,x,y,length] of [...pocketMapData.labels].sort((a,b)=>b[3]-a[3])) {
            if (!inView(x,y) || (mapState.zoom < 3 && length < 500)) continue;
            const radius = Math.min(110,name.length*3)*scale;
            if (occupied.some(v => Math.abs(v[0]-x) < v[2]+radius && Math.abs(v[1]-y)<20*scale)) continue;
            occupied.push([x,y,radius]);
            labelGroup.append(mapSVG("text",{x,y,"font-size":11*scale,"text-anchor":"middle"},name));
        }
    }
    const shown = mapVisiblePoints().filter(p=>p.xy && inView(...p.xy));
    shown.sort((a,b)=>Number(a.i===mapState.selected)-Number(b.i===mapState.selected));
    for (const p of shown) {
        const [x,y] = p.xy;
        const [type,symbol,color] = mapCategories[p.cat];
        const g = mapSVG("g",{transform:"translate("+x+" "+y+") scale("+scale+")","data-point":p.i,role:"button",tabindex:"0","aria-label":p.name+" "+p.address});
        g.append(mapSVG("title",{},p.name+" "+p.address));
        g.append(mapSVG("circle",{r: p.i===mapState.selected?12:9,fill:"#061315",stroke:color,"stroke-width":p.i===mapState.selected?2:1.4}));
        g.append(mapSVG("text",{x:0,y:3.5,fill:color,"font-size":11,"font-weight":"bold","text-anchor":"middle"},symbol));
        g.addEventListener("keydown", e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();mapSelect(p.i);}});
        markerGroup.append(g);
    }
    svg.querySelector(".map-minor").style.display = mapState.zoom >= 1.7 ? "" : "none";
}
function renderMapList() {
    const list = page.querySelector(".map-list");
    if (!list) return;
    list.replaceChildren();
    const rows = mapVisiblePoints();
    mapState.cursor = Math.max(0, Math.min(mapState.cursor, rows.length-1));
    if (!rows.length) {list.textContent = "Нічого не знайшов."; return;}
    rows.forEach((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "map-row";
        b.classList.toggle("map-cursor", i === mapState.cursor);
        const sign = document.createElement("span");
        sign.className = "map-sign";
        sign.textContent = mapCategories[p.cat][1]; sign.style.color = mapCategories[p.cat][2];
        const desc = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = p.name;
        const address = document.createElement("small");
        address.textContent = (p.address || "Адреси немає") + (p.xy ? "" : " · без точки");
        desc.append(name,address); b.append(sign,desc);
        b.onclick = () => {mapState.cursor = i;mapSelect(p.i,Boolean(p.xy));};
        list.append(b);
    });
}
function renderMapUI() {
    const root = page.querySelector(".map-panel");
    if (!root) return;
    root.querySelector(".map-viewport").hidden = mapState.mode !== "map";
    root.querySelector(".map-tools").hidden = mapState.mode !== "map";
    root.querySelector(".map-list-panel").hidden = mapState.mode !== "list";
    root.querySelector(".map-switch").textContent = mapState.mode === "map" ? "Список" : "На карту";
    root.querySelectorAll(".map-filter").forEach(b=>b.classList.toggle("map-active",b.dataset.cat===mapState.category));
    renderMapView();
    if (mapState.mode === "list") renderMapList();
    mapShowDetails();
}
function openMap() {
    mapState.mode = "map"; mapState.selected = -1; mapState.query = "";
    page.innerHTML = `<div class="map-panel">
        <div class="menu-header map-title">Миргород <span>ОФЛАЙН</span></div>
        <div class="map-filters" aria-label="Що показувати"></div>
        <div class="map-top"><button class="map-switch" type="button">Список</button><span>Без GPS</span></div>
        <div class="map-viewport"><svg class="map-svg" xmlns="http://www.w3.org/2000/svg" aria-label="Карта Миргорода" preserveAspectRatio="xMidYMid meet"></svg><span class="map-north">↑ Пн</span><span class="map-scale"></span></div>
        <div class="map-tools"><button type="button" data-map="minus" aria-label="Віддалити">−</button><button type="button" data-map="reset">Все місто</button><button type="button" data-map="plus" aria-label="Наблизити">+</button></div>
        <div class="map-list-panel" hidden><input class="map-search" type="search" placeholder="Назва або вулиця" aria-label="Пошук місця"><div class="map-list"></div></div>
        <div class="map-detail" hidden></div>
        <div class="map-help">Тягни карту, крути коліщатко. Стрілки корпусу — рух.</div>
        <div class="map-credit">© OpenStreetMap contributors · ODbL · 26.11.2026<br>Укриття: списки міськради. Не всі адреси мають точку. Дані не в реальному часі.<br>101 — ДСНС · 102 — поліція · 103 — швидка<br><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">Ліцензія карти</a> · <a href="https://myrgorod.pl.ua/news/perelik-zahysnyh-sporud-i-ukryttiv-gromady" target="_blank" rel="noopener">Перелік укриттів</a></div>
    </div>`;
    const filters = page.querySelector(".map-filters");
    for (const [cat,[name,symbol,color]] of Object.entries(mapCategories)) {
        const b = document.createElement("button"); b.type="button";b.className="map-filter";b.dataset.cat=cat;
        b.textContent = cat==="all" ? name : symbol+" "+name;
        b.style.setProperty("--map-accent",color);
        b.onclick=()=>{mapState.category=cat;mapState.selected=-1;mapState.cursor=0;renderMapUI();};
        filters.append(b);
    }
    const svg = page.querySelector(".map-svg");
    for (const k of ["green","water","waterline","minor","street","major","rail"]) {
        svg.append(mapSVG("path",{d:pocketMapData.layers[k]||"",class:"map-layer map-"+k}));
    }
    svg.append(mapSVG("g",{class:"map-labels"}),mapSVG("g",{class:"map-markers"}));
    let drag = null, touchPoints = new Map(), pinch = null;
    svg.addEventListener("pointerdown",e=>{
        if (e.button !== 0 && e.pointerType === "mouse") return;
        touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
        svg.setPointerCapture(e.pointerId);
        if(touchPoints.size===2){
            const [a,b]=[...touchPoints.values()];pinch={dist:Math.hypot(a.x-b.x,a.y-b.y),zoom:mapState.zoom};drag=null;return;
        }
        if(touchPoints.size===1) drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:mapState.x,cy:mapState.y,point:e.target.closest("[data-point]"),moved:false};
    });
    svg.addEventListener("pointermove",e=>{
        if(!touchPoints.has(e.pointerId)) return;
        touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(pinch&&touchPoints.size===2){const [a,b]=[...touchPoints.values()];mapState.zoom=Math.max(.75,Math.min(12,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.dist)));renderMapView();return;}
        if(!drag||drag.id!==e.pointerId)return;
        const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
        if(Math.hypot(dx,dy)>4)drag.moved=true;
        if(drag.moved){const scale=mapFrame().w/Math.max(1,svg.getBoundingClientRect().width);mapState.x=drag.cx-dx*scale;mapState.y=drag.cy-dy*scale;mapClamp();renderMapView();}
    });
    function endDrag(e) {
        const old=drag; touchPoints.delete(e.pointerId);
        if(old&&old.id===e.pointerId){drag=null;if(e.type==="pointerup"&&!old.moved&&old.point)mapSelect(Number(old.point.dataset.point));}
        if(touchPoints.size<2)pinch=null;
    }
    svg.addEventListener("pointerup",endDrag);svg.addEventListener("pointercancel",endDrag);svg.addEventListener("lostpointercapture",endDrag);
    svg.addEventListener("wheel",e=>{e.preventDefault();mapZoom(e.deltaY<0?1.2:1/1.2);},{passive:false});
    page.querySelector(".map-switch").onclick=()=>{mapState.mode=mapState.mode==="map"?"list":"map"; mapState.selected=-1;mapState.query="";page.querySelector(".map-search").value="";renderMapUI();};
    page.querySelector(".map-search").oninput=e=>{mapState.query=e.target.value;mapState.cursor=0;mapState.selected=-1;renderMapList();mapShowDetails();};
    page.querySelector('[data-map="plus"]').onclick=()=>mapZoom(1.3);
    page.querySelector('[data-map="minus"]').onclick=()=>mapZoom(1/1.3);
    page.querySelector('[data-map="reset"]').onclick=()=>{mapState.x=2900;mapState.y=4050;mapState.zoom=.85;mapState.selected=-1;renderMapUI();};
    renderMapUI();screen.scrollTop=0;
}
function moveMap(direction) {
    if(mapState.mode==="list"){
        mapState.cursor=Math.max(0,Math.min(mapVisiblePoints().length-1,mapState.cursor+Math.sign(direction)));
        renderMapList();page.querySelector(".map-cursor")?.scrollIntoView({block:"nearest"});return;
    }
    const step=mapFrame().w*.13;
    if(Math.abs(direction)===3)mapState.y+=Math.sign(direction)*step;
    else mapState.x+=Math.sign(direction)*step;
    mapClamp();renderMapView();
}
function confirmMap(){
    if(mapState.mode==="list"){const p=mapVisiblePoints()[mapState.cursor];if(p)mapSelect(p.i,Boolean(p.xy));return;}
    const f=mapFrame();const closest=mapVisiblePoints().filter(p=>p.xy&&Math.abs(p.xy[0]-mapState.x)<f.w/2&&Math.abs(p.xy[1]-mapState.y)<f.h/2)
        .sort((a,b)=>Math.hypot(a.xy[0]-mapState.x,a.xy[1]-mapState.y)-Math.hypot(b.xy[0]-mapState.x,b.xy[1]-mapState.y))[0];
    if(closest)mapSelect(closest.i);else{mapState.mode="list";renderMapUI();}
}
function backFromMap(){
    if(mapState.selected!==-1){mapState.selected=-1;renderMapUI();return true;}
    if(mapState.mode==="list"){mapState.mode="map";mapState.query="";page.querySelector(".map-search").value="";renderMapUI();return true;}
    return false;
}

// Ігри — піксельний теніс із корешем, повністю офлайн.
const tennisKey = "pocketdevice.tennis.v1";
const TENNIS = {w: 288,h: 224,left: 12,right: 276,top: 37,bottom: 186,playerWidth: 48,aiWidth: 42,paddleH: 5,r: 3};
const tennisPhrases = {
    start: ["Ну шо, погнали!", "Не піддаватимусь.", "Давай, покажи клас."],
    point: ["Опа, оце нормально!", "Ніхуя собі!", "Ну ладно, твоя взяла."],
    lose: ["Ха! Лови подачу.", "Ну шо ти?", "Оце діло!"],
    won: ["Єбать, ти мене зробив.", "Ну ладно, красавчик!", "Та заєбісь зіграв."],
    lost: ["Ну шо, ще раз?", "Ха, я ж казав!", "Не кисни, відіграєшся."]
};
function readTennisStats() {
    try {
        const raw = JSON.parse(localStorage.getItem(tennisKey));
        if (raw && Number.isSafeInteger(raw.wins) && raw.wins >= 0 &&
            Number.isSafeInteger(raw.losses) && raw.losses >= 0) return {wins:raw.wins,losses:raw.losses};
    } catch {}
    return {wins:0,losses:0};
}
let tennisStats = readTennisStats();
let tennis = null, tennisRAF = 0, tennisLast = 0, tennisPointer = null;
const tennisHeld = new Set();
const tennisChimp = new Image();
tennisChimp.src = "chimp.png";
const tClamp = (n,a,b) => Math.max(a,Math.min(b,n));
const tPhrase = group => tennisPhrases[group][Math.floor(Math.random()*tennisPhrases[group].length)];
function freshTennis() {
    return {phase:"ready",player:144,ai:144,x:144,y:112,vx:0,vy:0,
        you:0,him:0,serveDir:1,wait:0,rally:0,aiClock:0,aiTarget:144,aiError:0,
        phrase:"Ну шо, в теніс?",saved:false};
}
function tennisPaddleX(x,width) { return tClamp(x,TENNIS.left+width/2,TENNIS.right-width/2); }
function tennisServe(s,dir) {
    s.x=144;s.y=112;s.vx=(Math.random()<.5?-1:1)*(42+Math.random()*36);
    s.vy=(dir||1)*86;s.rally=0;s.aiTarget=144;s.aiClock=0;
    s.aiError=(Math.random()-.5)*38;
}
function tennisStart() {
    tennis=freshTennis();
    tennis.phase="between";tennis.wait=.85;tennis.phrase=tPhrase("start");
    tennisServe(tennis,Math.random()<.5?-1:1);
    tennisLast=0;tennisUpdateUI();tennisDraw();
}
function tennisConfirm() {
    if (!tennis) return;
    if(tennis.phase==="ready"||tennis.phase==="over") {tennisStart();return;}
    if(tennis.phase==="paused"){tennis.phase=tennis.resumePhase||"playing";tennisLast=0;}
    else if(tennis.phase==="playing"||tennis.phase==="between"){
        tennis.resumePhase=tennis.phase;tennis.phase="paused";tennisHeld.clear();tennisPointer=null;
    }
    tennisUpdateUI();tennisDraw();
}
function tennisPoint(s,playerWon) {
    if(s.phase!=="playing")return;
    if(playerWon)s.you++;else s.him++;
    pdSound(s.you===5?"win":s.him===5?"lose":playerWon?"point":"conceded");
    if(s.you===5||s.him===5){
        s.phase="over"; s.phrase=tPhrase(s.you===5?"won":"lost");
        if(!s.saved){
            s.saved=true; if(s.you===5)tennisStats.wins++;else tennisStats.losses++;
            try {localStorage.setItem(tennisKey,JSON.stringify(tennisStats));} catch {}
        }
    } else {
        s.phase="between";s.wait=.85;s.phrase=tPhrase(playerWon?"point":"lose");
        s.serveDir=-s.serveDir;tennisServe(s,s.serveDir);
    }
    tennisUpdateUI();
}
function tennisBounce(s,paddle,half,dir){
    pdSound("hit");
    const impact=tClamp((s.x-paddle)/half,-1,1);
    const speed=Math.min(215,Math.hypot(s.vx,s.vy)+7);
    const angle=impact*.94;
    s.vx=Math.sin(angle)*speed;
    s.vy=Math.abs(Math.cos(angle)*speed)*dir;
    s.rally++;
    if(dir===-1)s.aiError=(Math.random()-.5)*48;
}
function tennisTick(s,dt){
    if(!s || s.phase==="ready" || s.phase==="paused" || s.phase==="over")return;
    const D=TENNIS;
    const move=(tennisHeld.has("right")?1:0)-(tennisHeld.has("left")?1:0);
    s.player=tennisPaddleX(s.player+move*210*dt,D.playerWidth);
    if(s.phase==="between"){
        s.wait-=dt;
        if(s.wait<=0){s.phase="playing";tennisUpdateUI();}
        return;
    }
    s.aiClock-=dt;
    if(s.aiClock<=0){
        s.aiClock=.10+Math.random()*.09;
        s.aiTarget=s.vy<0 ? s.x+s.aiError : 144;
    }
    const aiStep=106*dt;
    s.ai=tennisPaddleX(s.ai+tClamp(s.aiTarget-s.ai,-aiStep,aiStep),D.aiWidth);
    const oldY=s.y;
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.x<D.left+D.r){s.x=2*(D.left+D.r)-s.x;s.vx=Math.abs(s.vx);pdSound("wall");}
    if(s.x>D.right-D.r){s.x=2*(D.right-D.r)-s.x;s.vx=-Math.abs(s.vx);pdSound("wall");}
    const a=D.top+D.paddleH+D.r, p=D.bottom-D.r;
    if(s.vy<0&&oldY>=a&&s.y<=a&&Math.abs(s.x-s.ai)<=D.aiWidth/2+D.r){
        s.y=a;tennisBounce(s,s.ai,D.aiWidth/2,1);
    } else if(s.vy>0&&oldY<=p&&s.y>=p&&Math.abs(s.x-s.player)<=D.playerWidth/2+D.r){
        s.y=p;tennisBounce(s,s.player,D.playerWidth/2,-1);
    }
    if(s.y< D.top-15)tennisPoint(s,true);
    else if(s.y>D.bottom+16)tennisPoint(s,false);
}
function tennisUpdateUI(){
    if(currentPage!=="games"||!tennis)return;
    const s=tennis;
    const $=sel=>page.querySelector(sel);
    $(".tennis-your-score").textContent=s.you;
    $(".tennis-his-score").textContent=s.him;
    $(".tennis-phrase").textContent=s.phrase;
    const phase={ready:"ДО 5 ОЧОК",playing:"МАТЧ",between:"ПОДАЧА",paused:"ПАУЗА",over:s.you===5?"ТИ ВИГРАВ":"КОРЕШ ВИГРАВ"};
    $(".tennis-phase").textContent=phase[s.phase];
    $(".tennis-action").textContent={ready:"Грати",playing:"Пауза",between:"Пауза",paused:"Продовжити",over:"Реванш"}[s.phase];
    $(".tennis-stats").textContent="Перемоги: "+tennisStats.wins+"  ·  Поразки: "+tennisStats.losses;
}
function tennisDraw(){
    if(currentPage!=="games"||!tennis)return;
    const c=page.querySelector(".tennis-court"),ctx=c?.getContext("2d");
    if(!ctx)return;
    const s=tennis,D=TENNIS;
    ctx.imageSmoothingEnabled=false;
    function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    rect("#071310",0,0,D.w,D.h);
    // Поле, розмітка та сітка.
    rect("#0e2924",D.left,D.top+5,D.right-D.left,D.bottom-D.top-5);
    rect("#2f655a",D.left,D.top,1,D.bottom-D.top+5);
    rect("#2f655a",D.right-1,D.top,1,D.bottom-D.top+5);
    rect("#2f655a",D.left,D.top,D.right-D.left,1);
    rect("#2f655a",D.left,D.bottom+5,D.right-D.left,1);
    rect("#214a41",D.left+23,66,D.right-D.left-46,1);
    rect("#214a41",D.left+23,158,D.right-D.left-46,1);
    rect("#214a41",143,66,1,92);
    for(let x=D.left;x<D.right;x+=8)rect("#548c80",x,111,4,2);
    // Ракетки, тіні та піксельні маркери гравців.
    rect("#163b34",s.ai-D.aiWidth/2, D.top+2,D.aiWidth,8);
    rect("#85bdb0",s.ai-D.aiWidth/2,D.top,D.aiWidth,D.paddleH);
    rect("#122e2a",s.player-D.playerWidth/2,D.bottom+2,D.playerWidth,8);
    rect("#65e8d6",s.player-D.playerWidth/2,D.bottom,D.playerWidth,D.paddleH);
    // Та сама піксельна мавпа з розділу «Кореш»; якщо файл відсутній — простий піксельний знак.
    if(tennisChimp.complete&&tennisChimp.naturalWidth){
        const h=31,w=Math.min(43,h*tennisChimp.naturalWidth/tennisChimp.naturalHeight);
        ctx.drawImage(tennisChimp,Math.round(s.ai-w/2),3,Math.round(w),h);
    } else {
        const a=s.ai;
        rect("#65e8d6",a-9,10,18,3); rect("#315b51",a-10,13,20,15);
        rect("#65e8d6",a-13,17,4,7);rect("#65e8d6",a+9,17,4,7);
        rect("#a5d5c8",a-7,16,14,12);rect("#071310",a-5,18,2,2);rect("#071310",a+3,18,2,2);
        rect("#315b51",a-4,24,8,2);rect("#65e8d6",a-10,9,15,4);rect("#65e8d6",a+4,12,9,2);
    }
    rect("#65e8d6",s.player-5,201,10,9);
    rect("#65e8d6",s.player-9,211,18,4);
    if(s.phase==="playing"||s.phase==="between"||s.phase==="paused"){
        rect("#71b5a4",s.x-4,s.y-4,8,8);
        rect("#d1fff2",s.x-D.r,s.y-D.r,2*D.r,2*D.r);
    }
    if(s.phase==="ready"||s.phase==="paused"||s.phase==="over"){
        rect("#071310",43,92,202,40);
        rect("#376a5e",43,92,202,1);rect("#376a5e",43,131,202,1);
        ctx.fillStyle="#65e8d6";ctx.font="bold 13px monospace";ctx.textAlign="center";
        ctx.fillText(s.phase==="ready"?"НУ ШО, ПОГНАЛИ?":s.phase==="paused"?"ПАУЗА":s.you===5?"ПЕРЕМОГА!":"ПРОГРАВ!",144,116);
    }
}
function tennisLoop(now){
    tennisRAF=0;
    if(currentPage!=="games"||!tennis)return;
    const dt=tennisLast?Math.min(.05,Math.max(0,(now-tennisLast)/1000)):0;
    tennisLast=now;
    // Маленькі фізичні кроки не дають м'ячу пролетіти крізь ракетку.
    const n=Math.max(1,Math.ceil(dt/.012));
    for(let i=0;i<n;i++)tennisTick(tennis,dt/n);
    tennisDraw();tennisRAF=requestAnimationFrame(tennisLoop);
}
function openTennis(){
    tennis=freshTennis();tennisLast=0;tennisHeld.clear();tennisPointer=null;
    page.innerHTML=`<div class="tennis-panel">
        <div class="menu-header tennis-title">Теніс <span>1 НА 1</span></div>
        <div class="tennis-scoreboard">
            <div><span>ТИ</span><strong class="tennis-your-score">0</strong></div>
            <span class="tennis-phase">ДО 5 ОЧОК</span>
            <div><span class="tennis-opponent">КОРЕШ</span><strong class="tennis-his-score">0</strong></div>
        </div>
        <canvas class="tennis-court" width="288" height="224" aria-label="Піксельне тенісне поле. Твоя ракетка знизу."></canvas>
        <div class="tennis-phrase" aria-live="polite"></div>
        <button type="button" class="tennis-action">Грати</button>
        <div class="tennis-stats"></div>
        <div class="tennis-help">◀ ▶ — рух (можна тримати). ● — старт / пауза.<br>Миша або палець — тягни свою ракетку. Перший до 5 очок.</div>
    </div>`;
    const name=characterSettings.names[activeCharacter().id];
    if(name)page.querySelector(".tennis-opponent").textContent=name;
    const c=page.querySelector(".tennis-court");
    function aim(e){
        if(!tennis||!["playing","between"].includes(tennis.phase))return;
        const r=c.getBoundingClientRect();
        if(r.width>0)tennis.player=tennisPaddleX((e.clientX-r.left)*TENNIS.w/r.width,TENNIS.playerWidth);
    }
    c.addEventListener("pointerdown",e=>{
        if(!tennis||!["playing","between"].includes(tennis.phase)||e.button>0)return;
        tennisPointer=e.pointerId;c.setPointerCapture(e.pointerId);aim(e);
    });
    c.addEventListener("pointermove",e=>{if(tennisPointer===e.pointerId)aim(e);});
    for(const k of ["pointerup","pointercancel","lostpointercapture"])c.addEventListener(k,e=>{if(tennisPointer===e.pointerId)tennisPointer=null;});
    page.querySelector(".tennis-action").onclick=tennisConfirm;
    tennisUpdateUI();tennisDraw();
    if(tennisRAF)cancelAnimationFrame(tennisRAF);
    tennisRAF=requestAnimationFrame(tennisLoop);screen.scrollTop=0;
}
function moveTennis(direction){
    if(!tennis||!["playing","between"].includes(tennis.phase)||Math.abs(direction)!==1)return;
    tennis.player=tennisPaddleX(tennis.player+direction*13,TENNIS.playerWidth);tennisDraw();
}
function closeTennis(){
    if(tennisRAF)cancelAnimationFrame(tennisRAF);
    tennisRAF=0;tennisLast=0;tennisHeld.clear();tennisPointer=null;tennis=null;
}
function tennisPauseOnBlur(){
    tennisHeld.clear();tennisPointer=null;
    if(currentPage==="games"&&tennis&&["playing","between"].includes(tennis.phase))tennisConfirm();
}
function bindTennisControls(){
    for(const id of ["left","right"]){
        const button=document.getElementById(id);
        button.addEventListener("pointerdown",e=>{
            if(currentPage!=="games"||!tennis||!["playing","between"].includes(tennis.phase))return;
            tennisHeld.add(id);button.setPointerCapture(e.pointerId);
        });
        for(const name of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(name,()=>tennisHeld.delete(id));
    }
    document.addEventListener("keydown",e=>{
        if(currentPage!=="games"||!tennis)return;
        if(e.code==="ArrowLeft"||e.code==="ArrowRight"){
            e.preventDefault();tennisHeld.add(e.code==="ArrowLeft"?"left":"right");
        } else if((e.code==="Space"||e.code==="Enter")&&!e.repeat){
            e.preventDefault();tennisConfirm();
        } else if(e.code==="Escape"&&!e.repeat){e.preventDefault();tennisPauseOnBlur();}
    });
    document.addEventListener("keyup",e=>{
        if(e.code==="ArrowLeft")tennisHeld.delete("left");
        if(e.code==="ArrowRight")tennisHeld.delete("right");
    });
    window.addEventListener("blur",tennisPauseOnBlur);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)tennisPauseOnBlur();});
}

// Таймер і секундомір. Час рахується від позначки часу, а не кількості тактів інтервалу.
const clockState = {
    mode:"timer", focus:1, duration:300000, remaining:300000,
    timerPhase:"ready", deadline:0,
    swElapsed:0, swStart:0, swRunning:false, laps:[], lapNumber:0, lastLap:0
};
let clockInterval=null, clockAudio=null, clockAlarm=null, clockRingNodes=[];
const clockUnits=[3600000,60000,1000];
const clockMax=99*3600000+59*60000+59*1000;
const clockPad=n=>String(n).padStart(2,"0");
function clockTimeParts(ms){
    let seconds=Math.max(0,Math.floor(ms/1000));
    return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60];
}
function clockFormat(ms,decimal=false){
    const [h,m,s]=clockTimeParts(ms);
    return [clockPad(h),clockPad(m),clockPad(s)].join(":")+(decimal?"."+clockPad(Math.floor(Math.max(0,ms)%1000/10)):"");
}
function clockTimerLeft(now=Date.now()){
    return clockState.timerPhase==="running"?Math.max(0,clockState.deadline-now):clockState.remaining;
}
function clockStopwatchTime(now=Date.now()){
    return clockState.swElapsed+(clockState.swRunning?Math.max(0,now-clockState.swStart):0);
}
function clockEnableSound(){
    try{
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return;
        if(!clockAudio)clockAudio=new Audio();
        if(clockAudio.state==="suspended")clockAudio.resume().catch(()=>{});
    }catch{}
}
function clockSilence(){
    for(const node of clockRingNodes){try{node.stop();}catch{}}
    clockRingNodes=[];
}
function clockRing(){
    if(!clockAudio||clockAudio.state!=="running"||deviceSettings.volume===0)return;
    clockSilence();
    try{
        const base=clockAudio.currentTime+.025;
        for(let i=0;i<6;i++){
            let osc=clockAudio.createOscillator(),gain=clockAudio.createGain();
            const start=base+i*.32;
            osc.type="square";osc.frequency.value=i%2?660:880;
            gain.gain.setValueAtTime(.0001,start);
            gain.gain.exponentialRampToValueAtTime(Math.max(.00011,.045*deviceSettings.volume/100),start+.015);
            gain.gain.exponentialRampToValueAtTime(.0001,start+.17);
            osc.connect(gain);gain.connect(clockAudio.destination);
            osc.start(start);osc.stop(start+.19);osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
            clockRingNodes.push(osc);
        }
    }catch{}
}
function clockDismissAlarm(){
    if(clockAlarm){clockAlarm.remove();clockAlarm=null;}
    clockSilence();
}
function clockNotify(){
    clockDismissAlarm();
    const div=document.createElement("div");
    div.className="clock-alarm";
    div.setAttribute("role","status");
    const words=document.createElement("span");
    words.textContent="⏱ Час вийшов!";
    const button=document.createElement("button");button.type="button";button.textContent="ОК";
    button.onclick=clockDismissAlarm;
    div.append(words,button);
    const display=document.querySelector(".display");
    if(display){display.append(div);clockAlarm=div;}
    clockRing();
}
function clockHeartbeat(){
    if(clockState.timerPhase==="running"&&clockTimerLeft()<=0){
        clockState.timerPhase="done";clockState.deadline=0;clockState.remaining=0;
        clockNotify();clockRefresh(true);
    }else clockRefresh(false);
    clockSchedule();
}
function clockSchedule(){
    const active=clockState.timerPhase==="running"||clockState.swRunning;
    if(active&&clockInterval===null)clockInterval=setInterval(clockHeartbeat,50);
    else if(!active&&clockInterval!==null){clearInterval(clockInterval);clockInterval=null;}
}
function clockSetTime(ms){
    if(clockState.timerPhase!=="ready"&&clockState.timerPhase!=="done")return;
    clockState.duration=Math.min(clockMax,Math.max(0,Math.round(ms/1000)*1000));
    clockState.remaining=clockState.duration;clockState.timerPhase="ready";
    clockRefresh(true);
}
function clockTimerAction(){
    clockHeartbeat();
    const s=clockState;
    if(s.timerPhase==="running"){
        s.remaining=clockTimerLeft();s.timerPhase="paused";s.deadline=0;
    }else{
        if(s.timerPhase==="done"){s.remaining=s.duration;s.timerPhase="ready";}
        if(s.remaining<=0){clockRefresh(true);return;}
        clockDismissAlarm();clockEnableSound();
        s.deadline=Date.now()+s.remaining;s.timerPhase="running";
    }
    clockRefresh(true);clockSchedule();
}
function clockResetTimer(){
    clockState.timerPhase="ready";clockState.deadline=0;
    clockState.remaining=clockState.duration;
    clockDismissAlarm();clockRefresh(true);clockSchedule();
}
function clockSwAction(){
    const s=clockState;
    if(s.swRunning){s.swElapsed=clockStopwatchTime();s.swRunning=false;s.swStart=0;}
    else{s.swStart=Date.now();s.swRunning=true;}
    clockRefresh(true);clockSchedule();
}
function clockSwReset(){
    Object.assign(clockState,{swRunning:false,swElapsed:0,swStart:0,laps:[],lapNumber:0,lastLap:0});
    clockRefresh(true);clockSchedule();
}
function clockLap(){
    const s=clockState;if(!s.swRunning)return;
    const elapsed=clockStopwatchTime();if(elapsed<=s.lastLap)return;
    s.laps.unshift({no:++s.lapNumber,at:elapsed,diff:elapsed-s.lastLap});
    s.lastLap=elapsed;if(s.laps.length>20)s.laps.pop();
    clockRefresh(true);
}
function clockRefresh(full=false){
    if(currentPage!=="timer")return;
    const root=page.querySelector(".clock-panel");if(!root)return;
    const s=clockState, timer=s.mode==="timer", selector=q=>root.querySelector(q);
    const ms=timer?clockTimerLeft():clockStopwatchTime();
    // Округлення вгору гарантує, що 00:00:00 з'явиться лише після завершення.
    const value=timer?clockFormat(Math.ceil(ms/1000)*1000):clockFormat(ms,true);
    selector(".clock-digits").textContent=value;
    if(!full)return;
    selector(".clock-tabs").querySelectorAll("button").forEach(b=>{
        b.classList.toggle("clock-selected",b.dataset.mode===s.mode);
        b.setAttribute("aria-pressed",String(b.dataset.mode===s.mode));
    });
    selector(".clock-status").textContent=timer?
        ({ready:"ВСТАНОВИ ЧАС",running:"ВІДЛІК",paused:"ПАУЗА",done:"ЧАС ВИЙШОВ"})[s.timerPhase]:
        s.swRunning?"РАХУЮ":s.swElapsed?"ПАУЗА":"ГОТОВИЙ";
    selector(".clock-edit").hidden=!timer||!["ready","done"].includes(s.timerPhase);
    selector(".clock-laps").hidden=timer;
    selector(".clock-lap").hidden=timer;
    selector(".clock-lap").disabled=!s.swRunning;
    const start=selector(".clock-start");
    start.textContent=timer?({ready:"Старт",running:"Пауза",paused:"Далі",done:"Ще раз"})[s.timerPhase]:
        s.swRunning?"Пауза":s.swElapsed?"Далі":"Старт";
    start.disabled=timer&&["ready","done"].includes(s.timerPhase)&&s.duration===0;
    const parts=clockTimeParts(s.duration);
    selector(".clock-edit").querySelectorAll("input").forEach((input,i)=>{
        if(document.activeElement!==input)input.value=clockPad(parts[i]);
        input.classList.toggle("clock-focused",i===s.focus);
    });
    const tabs=selector(".clock-other");
    tabs.textContent=timer? (s.swRunning?"Секундомір працює":""):
        s.timerPhase==="running"?"Таймер працює":s.timerPhase==="done"?"Таймер завершився":"";
    const list=selector(".clock-lap-list");
    list.replaceChildren();
    if(!s.laps.length){
        const empty=document.createElement("div");empty.className="clock-empty";empty.textContent="Ще нема проміжків.";list.append(empty);
    }
    for(const lap of s.laps){
        const li=document.createElement("div");li.className="clock-lap-row";
        for(const value of ["#"+lap.no,clockFormat(lap.at,true),"+"+clockFormat(lap.diff,true)]){
            const el=document.createElement("span");el.textContent=value;li.append(el);
        }
        list.append(li);
    }
}
function clockChangeMode(mode){
    clockState.mode=mode;clockRefresh(true);
}
function clockConfirm(){
    if(clockState.mode==="timer")clockTimerAction();else clockSwAction();
}
function moveClock(direction){
    const s=clockState;
    if(s.mode==="timer"&&["ready","done"].includes(s.timerPhase)){
        if(Math.abs(direction)===1){
            s.focus=(s.focus+direction+3)%3;clockRefresh(true);
        }else{
            const parts=clockTimeParts(s.duration);
            const max=s.focus===0?99:59;
            parts[s.focus]=(parts[s.focus]+(direction===-3?1:-1)+max+1)%(max+1);
            clockSetTime(parts.reduce((sum,n,i)=>sum+n*clockUnits[i],0));
        }
    }else if(Math.abs(direction)===1){
        clockChangeMode(s.mode==="timer"?"stopwatch":"timer");
    }else if(s.mode==="stopwatch"&&direction===-3)clockLap();
}
function openClock(){
    page.innerHTML=`<div class="clock-panel">
        <div class="menu-header clock-title">Таймер <span>ГОДИННИК</span></div>
        <div class="clock-tabs"><button type="button" data-mode="timer">Таймер</button><button type="button" data-mode="stopwatch">Секундомір</button></div>
        <div class="clock-face"><div class="clock-status"></div><div class="clock-digits" aria-label="Час"></div><div class="clock-other"></div></div>
        <div class="clock-edit">
            <label>ГОД<input type="number" min="0" max="99" inputmode="numeric" aria-label="Години"></label>
            <label>ХВ<input type="number" min="0" max="59" inputmode="numeric" aria-label="Хвилини"></label>
            <label>СЕК<input type="number" min="0" max="59" inputmode="numeric" aria-label="Секунди"></label>
        </div>
        <div class="clock-actions"><button type="button" class="clock-start">Старт</button><button type="button" class="clock-reset">Скинути</button><button type="button" class="clock-lap" hidden>Проміжок</button></div>
        <div class="clock-laps" hidden><div class="clock-lap-head"><span>КОЛО</span><span>ЧАС</span><span>РІЗНИЦЯ</span></div><div class="clock-lap-list"></div></div>
        <div class="clock-hint">● — старт / пауза. ◀ ▶ — вибір поля, ▲ ▼ — зміна цифр. У секундомірі ▲ — проміжок.<br>Час іде і в інших розділах.</div>
    </div>`;
    const root=page.querySelector(".clock-panel");
    root.querySelectorAll(".clock-tabs button").forEach(b=>b.onclick=()=>clockChangeMode(b.dataset.mode));
    const inputs=[...root.querySelectorAll(".clock-edit input")];
    function readInputs(){
        const nums=inputs.map((input,i)=>Math.min(i===0?99:59,Math.max(0,Math.floor(Number(input.value)||0))));
        clockSetTime(nums.reduce((sum,n,i)=>sum+n*clockUnits[i],0));
        return nums;
    }
    inputs.forEach((input,i)=>{
        input.onfocus=()=>{clockState.focus=i;clockRefresh(true);};
        input.oninput=()=>{readInputs();};
        input.onblur=()=>{const nums=readInputs();input.value=clockPad(nums[i]);};
        input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();input.blur();clockConfirm();}};
    });
    root.querySelector(".clock-start").onclick=clockConfirm;
    root.querySelector(".clock-reset").onclick=()=>clockState.mode==="timer"?clockResetTimer():clockSwReset();
    root.querySelector(".clock-lap").onclick=clockLap;
    clockHeartbeat();clockRefresh(true);screen.scrollTop=0;
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)clockHeartbeat();});

// Калькулятор — послідовні обчислення, як у кишеньковому калькуляторі.
const calcMemoryKey="pocketdevice.calculator.ans.v1";
const calcSymbols={"+":"+","-":"−","*":"×","/":"÷"};
const calcKeys=[
    ["AC","AC"],["DEL","⌫"],["SIGN","±"],["%","%"],
    ["7","7"],["8","8"],["9","9"],["/","÷"],
    ["4","4"],["5","5"],["6","6"],["*","×"],
    ["1","1"],["2","2"],["3","3"],["-","−"],
    ["ANS","Ans"],["0","0"],[".","."],["+","+"],
    ["=","="]
];
function calcReadAns(){
    try{const value=localStorage.getItem(calcMemoryKey);if(value!==null&&Number.isFinite(Number(value)))return Number(value);}catch{}
    return null;
}
let calcAns=calcReadAns(),calcCursor=0;
const freshCalc=()=>({entry:"0",acc:null,pending:null,replace:false,lastOp:null,lastOperand:null,trail:"",error:""});
let calcState=freshCalc();
function calcFormat(n){
    if(!Number.isFinite(n))return null;
    if(Object.is(n,-0)||n===0)return "0";
    // 12 значущих цифр: прибираємо типові похибки на кшталт 0.1+0.2.
    const value=Number(n.toPrecision(12));
    return Math.abs(value)>=1e12||(Math.abs(value)<1e-8&&value!==0)?
        value.toExponential(11).replace(/\.?0+e/,"e"):String(value);
}
function calcSaveAns(n){
    if(!Number.isFinite(n))return;
    calcAns=n;
    try{localStorage.setItem(calcMemoryKey,String(n));}catch{}
}
function calcError(message){
    pdSound("error");
    calcState.entry="0";calcState.error=message;calcState.acc=null;calcState.pending=null;
    calcState.replace=true;calcState.lastOp=null;calcState.lastOperand=null;calcState.trail="";
}
function calcSetValue(value){
    const text=calcFormat(value);
    if(text===null){calcError("Число завелике");return false;}
    calcState.entry=text;return true;
}
function calcCompute(a,op,b){
    if(op==="/"&&b===0){calcError("На нуль ділити не можна");return null;}
    let result;
    switch(op){case "+":result=a+b;break;case "-":result=a-b;break;case "*":result=a*b;break;case "/":result=a/b;break;default:return null;}
    if(!calcSetValue(result))return null;
    return Number(calcState.entry);
}
function calcInput(ch){
    const s=calcState;
    if(s.error){calcState=freshCalc();return calcInput(ch);}
    if(s.replace){
        s.entry="0";s.replace=false;s.lastOp=null;s.lastOperand=null;
        if(!s.pending)s.trail="";
    }
    if(ch==="."){
        if(!s.entry.includes(".")&&!s.entry.includes("e"))s.entry+=".";
        return;
    }
    if(s.entry.includes("e"))s.entry="0";
    if(s.entry==="0")s.entry=ch;
    else if(s.entry==="-0")s.entry=ch==="0"?"-0":"-"+ch;
    else if(s.entry.replace(/[-.]/g,"").length<12)s.entry+=ch;
}
function calcOperator(op){
    const s=calcState;if(s.error)return;
    if(s.pending&&s.acc!==null&&!s.replace){
        const result=calcCompute(s.acc,s.pending,Number(s.entry));if(result===null)return;
        s.acc=result;
    }else if(s.acc===null||!s.pending)s.acc=Number(s.entry);
    s.pending=op;s.replace=true;s.lastOp=null;s.lastOperand=null;
    s.trail=calcFormat(s.acc)+" "+calcSymbols[op];
}
function calcEquals(){
    const s=calcState;if(s.error)return;
    let a,op,b;
    if(s.pending&&s.acc!==null){
        a=s.acc;op=s.pending;b=s.replace?s.acc:Number(s.entry);
    }else if(s.lastOp&&s.lastOperand!==null){
        a=Number(s.entry);op=s.lastOp;b=s.lastOperand;
    }else{
        if(calcSetValue(Number(s.entry))){calcSaveAns(Number(s.entry));s.replace=true;}
        return;
    }
    const result=calcCompute(a,op,b);if(result===null)return;
    s.trail=calcFormat(a)+" "+calcSymbols[op]+" "+calcFormat(b)+" =";
    s.acc=null;s.pending=null;s.replace=true;s.lastOp=op;s.lastOperand=b;
    calcSaveAns(result);
}
function calcSign(){
    const s=calcState;if(s.error)return;
    if(s.pending&&s.replace){s.entry="-0";s.replace=false;return;}
    if(s.entry.startsWith("-"))s.entry=s.entry.slice(1);else s.entry="-"+s.entry;
    s.lastOp=null;s.lastOperand=null;
}
function calcPercent(){
    const s=calcState;if(s.error)return;
    let num=Number(s.entry)/100;
    if(s.pending==="+"||s.pending==="-")num*=s.acc;
    if(calcSetValue(num)){s.replace=false;s.lastOp=null;s.lastOperand=null;}
}
function calcDelete(){
    const s=calcState;if(s.error){calcState=freshCalc();return;}
    if(s.replace&&s.pending)s.entry="0";
    else if(s.entry.includes("e"))s.entry="0";
    else s.entry=s.entry.slice(0,-1);
    if(!s.entry||s.entry==="-")s.entry="0";
    s.replace=false;s.lastOp=null;s.lastOperand=null;
    if(!s.pending)s.trail="";
}
function calcRecall(){
    if(calcAns===null)return;
    if(calcState.error)calcState=freshCalc();
    if(calcSetValue(calcAns)){
        calcState.replace=false;calcState.lastOp=null;calcState.lastOperand=null;
        if(!calcState.pending)calcState.trail="";
    }
}
function calcPress(key){
    if(key==="AC")calcState=freshCalc();
    else if(key==="DEL")calcDelete();
    else if(key==="SIGN")calcSign();
    else if(key==="%")calcPercent();
    else if(key==="ANS")calcRecall();
    else if(key==="=")calcEquals();
    else if(Object.hasOwn(calcSymbols,key))calcOperator(key);
    else if(/^[0-9.]$/.test(key))calcInput(key);
    calcRender();
}
function calcRender(){
    if(currentPage!=="calculator")return;
    const root=page.querySelector(".calc-panel");if(!root)return;
    const s=calcState;
    root.querySelector(".calc-expression").textContent=s.trail||" ";
    root.querySelector(".calc-number").textContent=s.error?"ERROR":s.entry;
    root.querySelector(".calc-number").classList.toggle("calc-small",s.entry.length>12);
    root.querySelector(".calc-message").textContent=s.error||" ";
    root.querySelector(".calc-memory").textContent=calcAns===null?"Ans: —":"Ans: "+calcFormat(calcAns);
    root.querySelectorAll(".calc-key").forEach((button,i)=>{
        button.classList.toggle("calc-cursor",i===calcCursor);
        button.disabled=button.dataset.key==="ANS"&&calcAns===null;
    });
}
function moveCalculator(direction){
    const row=Math.floor(calcCursor/4),col=calcCursor%4;
    if(Math.abs(direction)===3){
        const next=Math.min(5,Math.max(0,row+Math.sign(direction)));
        calcCursor=next===5?20:next*4+col;
    }else if(row!==5){
        calcCursor=row*4+Math.min(3,Math.max(0,col+direction));
    }
    calcRender();
}
function confirmCalculator(){calcPress(calcKeys[calcCursor][0]);}
function openCalculator(){
    page.innerHTML=`<div class="calc-panel">
        <div class="menu-header calc-title">Калькулятор <span>12 ЦИФР</span></div>
        <div class="calc-display">
            <div class="calc-expression"></div>
            <div class="calc-number" aria-label="Результат" aria-live="polite"></div>
            <div class="calc-message"></div>
            <div class="calc-memory"></div>
        </div>
        <div class="calc-grid"></div>
        <div class="calc-help">Стрілки корпусу — вибір кнопки, ● — натиснути.<br>Можна також користуватися клавіатурою.</div>
    </div>`;
    const grid=page.querySelector(".calc-grid");
    const labels={AC:"Очистити все",DEL:"Стерти цифру",SIGN:"Змінити знак",ANS:"Останній результат","%":"Відсотки","/":"Поділити","*":"Помножити","-":"Відняти","+":"Додати","=":"Дорівнює",".":"Десяткова крапка"};
    calcKeys.forEach(([key,label],i)=>{
        const b=document.createElement("button");b.type="button";b.className="calc-key";b.dataset.key=key;b.textContent=label;
        b.setAttribute("aria-label",labels[key]||label);
        if(Object.hasOwn(calcSymbols,key)||key==="SIGN"||key==="%")b.classList.add("calc-operator");
        if(key==="=")b.classList.add("calc-equal");
        if(key==="AC"||key==="DEL")b.classList.add("calc-clear");
        b.onclick=()=>{calcCursor=i;calcPress(key);};grid.append(b);
    });
    calcRender();screen.scrollTop=0;
}
document.addEventListener("keydown",e=>{
    if(currentPage!=="calculator"||clockAlarm||e.ctrlKey||e.altKey||e.metaKey)return;
    const arrows={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3};
    if(Object.hasOwn(arrows,e.key)){
        e.preventDefault();moveCalculator(arrows[e.key]);return;
    }
    const replacements={Enter:"=",Escape:"AC",Backspace:"DEL",Delete:"AC",",":"."};
    const key=replacements[e.key]||e.key;
    if(calcKeys.some(k=>k[0]===key)){
        e.preventDefault();calcCursor=calcKeys.findIndex(k=>k[0]===key);calcPress(key);
    }
});

// Налаштування дисплея та пристрою. Зберігаються локально, незалежно від інших даних.
const deviceSettingsKey="pocketdevice.settings.v1";
const deviceThemes=[
    {id:"cyan",name:"Бірюзовий",filter:"hue-rotate(0deg)"},
    {id:"green",name:"Зелений",filter:"hue-rotate(-36deg) saturate(1.25)"},
    {id:"amber",name:"Бурштиновий",filter:"hue-rotate(-138deg) saturate(1.4)"},
    {id:"red",name:"Червоний",filter:"hue-rotate(174deg) saturate(1.55)"},
    {id:"white",name:"Білий",filter:"grayscale(1) brightness(1.12)"}
];
const deviceDefaults={theme:"cyan",brightness:100,volume:65,vibration:true,effects:100};
const deviceLimit=(n,a,b)=>Math.min(b,Math.max(a,n));
function deviceLoadSettings(){
    const d={...deviceDefaults};
    try{
        const s=JSON.parse(localStorage.getItem(deviceSettingsKey));
        if(!s||typeof s!=="object")return d;
        if(deviceThemes.some(t=>t.id===s.theme))d.theme=s.theme;
        for(const k of ["brightness","volume","effects"])if(typeof s[k]==="number"&&Number.isFinite(s[k]))d[k]=Math.round(deviceLimit(s[k],k==="brightness"?30:0,100));
        if(typeof s.vibration==="boolean")d.vibration=s.vibration;
    }catch{}
    return d;
}
let deviceSettings=deviceLoadSettings();
let deviceSettingCursor=0;
const deviceSettingRows=["theme","brightness","volume","vibration","effects","test","reset"];
function deviceApplySettings(){
    const theme=deviceThemes.find(t=>t.id===deviceSettings.theme)||deviceThemes[0];
    const style=document.documentElement.style;
    style.setProperty("--pd-display-filter",theme.filter+" brightness("+deviceSettings.brightness/100+")");
    style.setProperty("--pd-effects",String(deviceSettings.effects/100));
    // Таймер відтворює сигнал з поточною гучністю; майбутні звуки корпусу теж.
    style.setProperty("--pd-brightness",String(deviceSettings.brightness/100));
}
function deviceSaveSettings(){
    try{localStorage.setItem(deviceSettingsKey,JSON.stringify(deviceSettings));return true;}catch{return false;}
}
function deviceVibrationSupported(){
    return typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";
}
function deviceVibrate(duration=12){
    if(!deviceSettings.vibration||!deviceVibrationSupported())return false;
    try{return navigator.vibrate(duration)!==false;}catch{return false;}
}
function deviceSettingFeedback(message){
    if(currentPage!=="settings")return;
    const status=page.querySelector(".setting-message");
    if(status)status.textContent=message;
}
function deviceSetSetting(key,value,feedback=true){
    if(key==="theme"){
        if(!deviceThemes.some(t=>t.id===value))return;
        deviceSettings.theme=value;
    }else if(key==="vibration"){
        deviceSettings.vibration=Boolean(value);
    }else if(["brightness","volume","effects"].includes(key)&&Number.isFinite(Number(value))){
        deviceSettings[key]=Math.round(deviceLimit(Number(value),key==="brightness"?30:0,100));
    }else return;
    deviceApplySettings();
    const saved=deviceSaveSettings();
    deviceRefreshSettings();
    if(feedback)deviceSettingFeedback(saved?"Збережено":"Зміни діють, але браузер не зберіг їх.");
}
function deviceTestSound(){
    if(deviceSettings.volume===0){deviceSettingFeedback("Звук вимкнено.");return;}
    clockEnableSound();
    const audio=clockAudio;
    if(!audio){deviceSettingFeedback("Звук не підтримується цим браузером.");return;}
    function play(){
        if(audio.state!=="running"){deviceSettingFeedback("Браузер не дозволив відтворити звук.");return;}
        try{
            const now=audio.currentTime+.01, volume=.045*deviceSettings.volume/100;
            [720,960].forEach((freq,i)=>{
                const osc=audio.createOscillator(),gain=audio.createGain(),t=now+i*.12;
                osc.type="square";osc.frequency.value=freq;
                gain.gain.setValueAtTime(.0001,t);
                gain.gain.exponentialRampToValueAtTime(Math.max(.00011,volume),t+.012);
                gain.gain.exponentialRampToValueAtTime(.0001,t+.08);
                osc.connect(gain);gain.connect(audio.destination);
                osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
                osc.start(t);osc.stop(t+.09);
            });
            deviceSettingFeedback("Тестовий сигнал.");
        }catch{deviceSettingFeedback("Не вдалося відтворити звук.");}
    }
    if(audio.state==="suspended"){
        try{audio.resume().then(play).catch(()=>deviceSettingFeedback("Браузер заблокував звук."));}
        catch{deviceSettingFeedback("Браузер заблокував звук.");}
    }else play();
}
function deviceRefreshSettings(){
    if(currentPage!=="settings")return;
    const root=page.querySelector(".settings-panel");if(!root)return;
    root.querySelector(".setting-theme").value=deviceSettings.theme;
    for(const key of ["brightness","volume","effects"]){
        root.querySelector(".setting-"+key).value=deviceSettings[key];
        root.querySelector(".setting-value-"+key).textContent=deviceSettings[key]+"%";
    }
    const vibe=root.querySelector(".setting-vibration");
    vibe.textContent=deviceSettings.vibration?"Увімкнено":"Вимкнено";
    vibe.setAttribute("aria-pressed",String(deviceSettings.vibration));
    root.querySelector(".setting-vibration-note").textContent=deviceVibrationSupported()?"Коротка вібрація при натисканні":"Цей браузер не підтримує вібрацію";
    root.querySelectorAll(".setting-row").forEach(row=>{
        row.classList.toggle("setting-current",row.dataset.setting===deviceSettingRows[deviceSettingCursor]);
    });
}
function openDeviceSettings(){
    page.innerHTML=`<div class="settings-panel">
        <div class="menu-header settings-title">Налаштування <span>1.0</span></div>
        <div class="setting-row" data-setting="theme">
            <label for="setting-theme">Колір дисплея</label>
            <select id="setting-theme" class="setting-theme"></select>
        </div>
        <div class="setting-row" data-setting="brightness">
            <div class="setting-label"><label for="setting-brightness">Яскравість</label><span class="setting-value-brightness"></span></div>
            <input type="range" min="30" max="100" step="5" id="setting-brightness" class="setting-brightness">
        </div>
        <div class="setting-row" data-setting="volume">
            <div class="setting-label"><label for="setting-volume">Гучність</label><span class="setting-value-volume"></span></div>
            <input type="range" min="0" max="100" step="5" id="setting-volume" class="setting-volume">
        </div>
        <div class="setting-row" data-setting="vibration">
            <div class="setting-label"><span>Вібрація</span><button type="button" class="setting-vibration"></button></div>
            <small class="setting-vibration-note"></small>
        </div>
        <div class="setting-row" data-setting="effects">
            <div class="setting-label"><label for="setting-effects">Ефекти екрана</label><span class="setting-value-effects"></span></div>
            <input type="range" min="0" max="100" step="5" id="setting-effects" class="setting-effects">
        </div>
        <div class="setting-row" data-setting="test"><button type="button" class="setting-test">Тест звуку</button></div>
        <div class="setting-row" data-setting="reset"><button type="button" class="setting-reset">Стандартні параметри</button></div>
        <div class="setting-message" role="status"></div>
        <div class="setting-about">PocketDevice 1.0 · збірка 51<br>Працює офлайн.<br><span class="pwa-status">Перевіряю офлайн-кеш…</span><br>▲ ▼ — вибір. ◀ ▶ — змінити. ● — дія.</div>
    </div>`;
    const root=page.querySelector(".settings-panel");
    const select=root.querySelector(".setting-theme");
    for(const theme of deviceThemes){
        const option=document.createElement("option");option.value=theme.id;option.textContent=theme.name;select.append(option);
    }
    select.onchange=()=>deviceSetSetting("theme",select.value);
    for(const key of ["brightness","volume","effects"]){
        const input=root.querySelector(".setting-"+key);
        input.oninput=()=>deviceSetSetting(key,Number(input.value));
    }
    root.querySelector(".setting-vibration").onclick=()=>deviceToggleVibration();
    root.querySelector(".setting-test").onclick=deviceTestSound;
    root.querySelector(".setting-reset").onclick=deviceResetSettings;
    root.querySelectorAll(".setting-row").forEach(row=>row.addEventListener("pointerdown",()=>{
        deviceSettingCursor=deviceSettingRows.indexOf(row.dataset.setting);
        // Не переприсвоюємо value, поки користувач рухає повзунок.
        root.querySelectorAll(".setting-row").forEach(r=>r.classList.toggle("setting-current",r===row));
    }));
    deviceRefreshSettings();
    window.pdPwaUpdateStatus?.();
    screen.scrollTop=0;
}
function deviceToggleVibration(){
    deviceSetSetting("vibration",!deviceSettings.vibration);
    if(deviceSettings.vibration)deviceVibrate(25);
}
function deviceResetSettings(){
    deviceSettings={...deviceDefaults};deviceApplySettings();const saved=deviceSaveSettings();deviceRefreshSettings();
    deviceSettingFeedback(saved?"Стандартні параметри відновлено.":"Відновлено, але браузер не зберіг зміни.");
}
function moveDeviceSettings(direction){
    if(Math.abs(direction)===3){
        deviceSettingCursor=deviceLimit(deviceSettingCursor+Math.sign(direction),0,deviceSettingRows.length-1);
        deviceRefreshSettings();
        const row=page.querySelectorAll(".setting-row")[deviceSettingCursor];
        row?.scrollIntoView({block:"nearest"});
        return;
    }
    const key=deviceSettingRows[deviceSettingCursor];
    if(key==="theme"){
        let i=deviceThemes.findIndex(t=>t.id===deviceSettings.theme);
        deviceSetSetting(key,deviceThemes[(i+direction+deviceThemes.length)%deviceThemes.length].id);
    }else if(key==="vibration"){
        deviceSetSetting(key,direction>0);if(direction>0)deviceVibrate(25);
    }else if(["brightness","volume","effects"].includes(key)){
        deviceSetSetting(key,deviceSettings[key]+direction*5);
    }
}
function confirmDeviceSettings(){
    const key=deviceSettingRows[deviceSettingCursor];
    if(key==="vibration")deviceToggleVibration();
    else if(key==="test"||key==="volume")deviceTestSound();
    else if(key==="reset")deviceResetSettings();
    else moveDeviceSettings(1);
}
deviceApplySettings();
document.addEventListener("click",event=>{
    const target=event.target;
    if(target&&typeof target.closest==="function"&&target.closest(".device button:not(:disabled)"))deviceVibrate();
},true);

// PocketDevice — original retro sound and display engine. No media downloads.
const pdTones = {
    nav: [[740,0,.034,"square",.38]],
    click: [[340,0,.025,"triangle",.40]],
    confirm: [[1050,0,.043,"square",.42]],
    open: [[660,0,.055,"square",.45],[960,.067,.065,"square",.45]],
    back: [[782,0,.052,"square",.42],[440,.060,.062,"triangle",.55]],
    error: [[195,0,.09,"square",.50],[147,.115,.095,"square",.50]],
    boot: [[392,0,.085,"triangle",.48],[587,.10,.085,"square",.42],[784,.20,.105,"square",.42],[1047,.34,.13,"triangle",.55]],
    hit: [[530,0,.037,"square",.38]],
    wall: [[260,0,.027,"triangle",.35]],
    point: [[740,0,.045,"square",.45],[1050,.06,.06,"square",.40]],
    conceded: [[420,0,.055,"square",.38],[280,.065,.065,"triangle",.42]],
    win: [[523,0,.075,"square",.40],[659,.09,.07,"square",.40],[784,.18,.10,"square",.44],[1047,.30,.13,"triangle",.48]],
    lose: [[520,0,.07,"triangle",.45],[390,.08,.08,"square",.36],[260,.17,.12,"triangle",.45]]
};
let pdBootSoundPending=true,pdBootOverlay=null,pdBootTimeout=null,pdNoiseBuffer=null,pdLastCue=new Map();
function pdTone(audio,freq,delay,duration,wave,strength,start){
    const osc=audio.createOscillator(),gain=audio.createGain();
    const t=start+delay,vol=Math.max(.00011,.055*strength*deviceSettings.volume/100);
    osc.type=wave;osc.frequency.value=freq;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(vol,t+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(audio.destination);
    osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
    osc.start(t);osc.stop(t+duration+.006);
}
function pdMechanicalClick(audio,start){
    if(typeof audio.createBuffer!=="function"||typeof audio.createBufferSource!=="function")return;
    // Short, filtered-looking noise pulse: synthetic contact/relay click, not sampled hardware.
    if(!pdNoiseBuffer){
        const len=Math.max(32,Math.round(audio.sampleRate*.024));
        pdNoiseBuffer=audio.createBuffer(1,len,audio.sampleRate);
        const data=pdNoiseBuffer.getChannelData(0);
        let prior=0;
        for(let i=0;i<len;i++){
            prior=.28*prior+.72*(Math.random()*2-1);
            data[i]=prior*Math.exp(-i/(len*.16));
        }
    }
    const source=audio.createBufferSource(),gain=audio.createGain();
    source.buffer=pdNoiseBuffer;
    gain.gain.setValueAtTime(.13*deviceSettings.volume/100,start);
    source.connect(gain);gain.connect(audio.destination);
    source.onended=()=>{try{source.disconnect();gain.disconnect();}catch{}};
    source.start(start);
}
function pdSound(cue,gesture=false){
    if(!deviceSettings.volume||!pdTones[cue])return;
    if(!clockAudio&&gesture)clockEnableSound();
    const audio=clockAudio;if(!audio)return;
    const play=()=>{
        if(audio.state!=="running"||!deviceSettings.volume)return;
        const now=audio.currentTime,last=pdLastCue.get(cue);
        if(last!==undefined&&now-last<.025)return;
        pdLastCue.set(cue,now);
        const base=now+.004;
        try{
            if(["nav","click","confirm","open","back"].includes(cue))pdMechanicalClick(audio,base);
            for(const [freq,delay,len,wave,strength] of pdTones[cue])pdTone(audio,freq,delay,len,wave,strength,base);
        }catch{/* no sound does not block navigation */}
    };
    if(audio.state==="running")play();
    else if(gesture&&audio.state==="suspended"){
        try{audio.resume().then(play).catch(()=>{});}catch{}
    }
}
function pdFinishBoot(){
    if(pdBootTimeout!==null){clearTimeout(pdBootTimeout);pdBootTimeout=null;}
    const device=document.querySelector(".device");
    if(device)device.classList.remove("pd-booting");
    if(pdBootOverlay){pdBootOverlay.remove();pdBootOverlay=null;}
}
function pdFirstInteraction(){
    if(!pdBootSoundPending)return false;
    pdBootSoundPending=false;
    pdFinishBoot();
    pdSound("boot",true);
    return true;
}
function pdStartBoot(){
    if(!deviceSettings.effects||typeof window.matchMedia==="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const display=document.querySelector(".display"),device=document.querySelector(".device");
    if(!display||!device)return;
    const overlay=document.createElement("div");overlay.className="pd-boot";overlay.setAttribute("aria-hidden","true");
    overlay.innerHTML='<div class="pd-boot-symbol">▰</div><div class="pd-boot-logo">PocketDevice</div><div class="pd-boot-sub">ЗАВАНТАЖЕННЯ...</div><div class="pd-boot-track"><i></i></div>';
    display.append(overlay);pdBootOverlay=overlay;device.classList.add("pd-booting");
    pdBootTimeout=setTimeout(pdFinishBoot,1000);
}
function pdDisplaySettle(){
    if(!deviceSettings.effects)return;
    const display=document.querySelector(".display");if(!display)return;
    display.classList.remove("pd-settle");
    void display.offsetWidth;
    display.classList.add("pd-settle");
}
function pdBindFeedback(){
    // Capture phase: the current page is still the one the user is leaving.
    document.addEventListener("click",event=>{
        const target=event.target;
        if(!target||typeof target.closest!=="function")return;
        const button=target.closest(".device button");
        if(!button||button.disabled)return;
        if(pdFirstInteraction())return;
        const id=button.id;
        let cue="click";
        if(button.classList.contains("menu-item"))cue="open";
        else if(id==="confirm")cue=currentPage==="menu"?"open":"confirm";
        else if(id==="back")cue="back";
        else if(["up","down","left","right"].includes(id))cue="nav";
        else if(button.classList.contains("setting-test"))return; // preview has its own two-note sound
        else if(button.dataset.key==="=")cue="confirm";
        pdSound(cue,true);
    },true);
    document.addEventListener("keydown",event=>{
        if(!["calculator","games"].includes(currentPage)||event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;
        const key=event.key;
        if(!key)return;
        if(currentPage==="calculator"&&!/^[0-9+*/.,%=-]$/.test(key)&&!["Enter","Escape","Backspace","Delete","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(key))return;
        if(currentPage==="games"&&!["ArrowLeft","ArrowRight","Enter"," ","Escape"].includes(key))return;
        if(pdFirstInteraction())return;
        pdSound(key.startsWith("Arrow")?"nav":key==="Enter"||key==="="?"confirm":"click",true);
    },true);
    pdStartBoot();
}

// 49 — адаптація до видимої області смартфона, без визначення моделі чи збору даних.
let pdViewportMaxHeight=0,pdViewportLastWidth=0,pdViewportFrame=0;
function pdIsTouchDevice(){
    if(typeof window.matchMedia==="function"&&window.matchMedia("(pointer: coarse)").matches)return true;
    return typeof navigator!=="undefined"&&navigator.maxTouchPoints>0;
}
function pdPhysicalLandscape(width,height){
    // На телефонах екранна клавіатура може змінити CSS orientation, але не орієнтацію самого телефона.
    const orientation=window.screen?.orientation?.type;
    if(typeof orientation==="string"&&/^(landscape|portrait)/.test(orientation))return orientation.startsWith("landscape");
    if(typeof window.orientation==="number")return Math.abs(window.orientation)===90;
    return width>height;
}
function pdIsTextEntry(element){
    if(!element)return false;
    if(element.isContentEditable)return true;
    const tag=String(element.tagName||"").toLowerCase();
    if(tag==="textarea")return !element.readOnly&&!element.disabled;
    if(tag!=="input"||element.readOnly||element.disabled)return false;
    return !["range","checkbox","radio","button","submit","reset","file","color","hidden","image"].includes(element.type);
}
function pdAdjustCompanionBounds(){
    if(currentPage!=="companion")return;
    const room=page.querySelector(".companion-room"),sprite=page.querySelector(".companion-sprite");
    if(!room||!sprite)return;
    const maxX=Math.max(0,room.clientWidth-sprite.offsetWidth),maxY=Math.max(0,room.clientHeight-sprite.offsetHeight-17);
    if(sprite.offsetLeft>maxX||sprite.offsetLeft<0)sprite.style.left=Math.max(0,Math.min(maxX,sprite.offsetLeft))+"px";
    // If the companion is standing on the floor, anchor to it after reflow.
    if(!sprite.classList.contains("dragging")&&sprite.style.bottom!=="17px"&&sprite.offsetTop>maxY){
        sprite.style.top=maxY+"px";
    }
}
function pdUpdateViewport(){
    const root=document.documentElement,body=document.body;
    if(!root||!body)return;
    const vw=Math.max(1,root.clientWidth||window.innerWidth||375);
    const fullH=Math.max(1,window.innerHeight||root.clientHeight||667);
    const touch=pdIsTouchDevice();
    const phone=touch&&(vw<=650||fullH<=600);
    body.classList.toggle("pd-mobile",phone);
    if(!phone){
        body.classList.remove("pd-landscape","pd-keyboard");
        root.style.removeProperty("--pd-visible-h");
        pdViewportMaxHeight=0;pdViewportLastWidth=0;
        return;
    }
    const vv=window.visualViewport;
    // Browser pinch zoom stays available. Never force a different layout just because of zoom.
    if(vv&&Math.abs((vv.scale||1)-1)>.08)return;
    const height=Math.max(1,Math.round(vv?.height||fullH));
    if(Math.abs(vw-pdViewportLastWidth)>60){pdViewportMaxHeight=0;pdViewportLastWidth=vw;}
    const typing=pdIsTextEntry(document.activeElement);
    if(!typing)pdViewportMaxHeight=Math.max(pdViewportMaxHeight,height,fullH);
    else if(!pdViewportMaxHeight)pdViewportMaxHeight=Math.max(height,fullH);
    const keyboard=typing&&Math.max(pdViewportMaxHeight,fullH)-height>90;
    const landscape=pdPhysicalLandscape(vw,Math.max(pdViewportMaxHeight,fullH));
    root.style.setProperty("--pd-visible-h",height+"px");
    body.classList.toggle("pd-landscape",landscape);
    body.classList.toggle("pd-keyboard",keyboard);
    if(keyboard&&document.activeElement?.scrollIntoView){
        // Let the screen, not the surrounding web page, scroll the edited field into view.
        document.activeElement.scrollIntoView({block:"nearest",inline:"nearest"});
    }
    pdAdjustCompanionBounds();
}
function pdQueueViewport(){
    if(pdViewportFrame)return;
    pdViewportFrame=requestAnimationFrame(()=>{pdViewportFrame=0;pdUpdateViewport();});
}
function pdBindViewport(){
    pdUpdateViewport();
    window.addEventListener("resize",pdQueueViewport,{passive:true});
    window.addEventListener("orientationchange",()=>{
        pdViewportMaxHeight=0;pdViewportLastWidth=0;pdQueueViewport();
        setTimeout(pdQueueViewport,180);
    },{passive:true});
    window.visualViewport?.addEventListener("resize",pdQueueViewport,{passive:true});
    document.addEventListener("focusin",pdQueueViewport);
    document.addEventListener("focusout",()=>{setTimeout(pdQueueViewport,150);});
    if(typeof ResizeObserver==="function"){
        const observer=new ResizeObserver(pdAdjustCompanionBounds);
        observer.observe(document.querySelector(".display"));
    }
}

function updateSelection() {
    items.forEach((item, index) => {
        item.classList.toggle(
            "selected",
            index === selected
        );
    });
}

function moveSelection(direction) {
    if (currentPage === "settings") { moveDeviceSettings(direction); return; }
    if (currentPage === "calculator") { moveCalculator(direction); return; }
    if (currentPage === "timer") { moveClock(direction); return; }
    if (currentPage === "games") { moveTennis(direction); return; }
    if (currentPage === "map") { moveMap(direction); return; }
    if (currentPage === "library") { moveLibrary(direction); return; }
    if (currentPage === "notes") { navigateNotes(direction); return; }
    if (currentPage === "profile") {
        moveCharacterCursor(Math.sign(direction));
        return;
    }
    if (currentPage !== "menu") return;

    const next = selected + direction;

    if (next >= 0 && next < items.length) {
        selected = next;
        updateSelection();
    }
}

function openPage() {
    if (clockAlarm) { clockDismissAlarm(); return; }
    if (currentPage === "settings") { confirmDeviceSettings(); return; }
    if (currentPage === "calculator") { confirmCalculator(); return; }
    if (currentPage === "timer") { clockConfirm(); return; }
    if (currentPage === "games") { tennisConfirm(); return; }
    if (currentPage === "map") { confirmMap(); return; }
    if (currentPage === "library") { confirmLibrary(); return; }
    if (currentPage === "notes") { confirmNotes(); return; }
    if (currentPage === "profile") {
        if (document.activeElement === page.querySelector("#character-name")) {
            page.querySelector(".character-name-form").requestSubmit();
        } else {
            chooseCharacter();
        }
        return;
    }
    if (currentPage !== "menu") return;

    const item = items[selected];

    currentPage = item.dataset.page;
    pdDisplaySettle();

    menuHeader.hidden = true;
    menuGrid.hidden = true;

    page.hidden = false;

    page.innerHTML = `
        <div class="menu-header">
            ${item.textContent.trim()}
        </div>
        <p>Ще доробляємо...</p>
    `;

    if (currentPage === "profile") showCharacters();
    if (currentPage === "notes") showNotesList(true);
    if (currentPage === "library") openLibrary();
    if (currentPage === "map") openMap();
    if (currentPage === "games") openTennis();
    if (currentPage === "timer") openClock();
    if (currentPage === "calculator") openCalculator();
    if (currentPage === "settings") openDeviceSettings();

    if (currentPage === "companion") {
    page.innerHTML = `
        <div class="menu-header">Кореш</div>

        <div class="companion-room">
            <div class="companion-floor"></div>

<img src="chimp.png"
     class="companion-sprite"
     alt="Шимпанзе"
     draggable="false">
        </div>

        <div class="companion-dialogue">
            Ну шо, здоров!
        </div>
        <div class="companion-items">

    <button class="companion-item" data-item="beer">
        <svg viewBox="0 0 16 16">
            <path d="M4 1H12V3H13V13H12V15H4V13H3V3H4Z
                     M4 4H12M4 12H12M6 2H10"/>
        </svg>
        <span>Пиво</span>
    </button>

    <button class="companion-item" data-item="cigarette">
        <svg viewBox="0 0 16 16">
            <path d="M1 10H15V13H1Z
                     M5 10V13M12 10V13
                     M13 7L11 5L13 2"/>
        </svg>
        <span>Сіга</span>
    </button>

</div>
    `;
}
    if (currentPage === "companion") {
        const name = characterSettings.names[activeCharacter().id];
        if (name) page.querySelector(".menu-header").textContent = "Кореш: " + name;
    }
    screen.scrollTop = 0;
    if (currentPage === "companion") {
    startBlinking();
    enableCompanionDrag();
    enableCompanionItems();
startCompanionLife();
startCompanionWalking();
startCompanionSitting();
startCompanionSleeping();
startCompanionActions();
greetCompanion();
}
}

function goBack() {
    if (clockAlarm) { clockDismissAlarm(); return; }
    if (currentPage === "menu") return;
    if (currentPage === "games") closeTennis();
    if (currentPage === "map" && backFromMap()) return;
    if (currentPage === "notes" && backFromNotes()) return;
    if (currentPage === "library" && libraryBack()) return;

    currentPage = "menu";
    pdDisplaySettle();

    page.hidden = true;
    menuHeader.hidden = false;
    menuGrid.hidden = false;

    updateSelection();
}

document.getElementById("up").onclick =
    () => moveSelection(-3);

document.getElementById("down").onclick =
    () => moveSelection(3);

document.getElementById("left").onclick =
    () => moveSelection(-1);

document.getElementById("right").onclick =
    () => moveSelection(1);

document.getElementById("confirm").addEventListener("pointerdown", event => {
    if (currentPage === "profile" && document.activeElement === page.querySelector("#character-name")) {
        event.preventDefault();
    }
});
document.getElementById("confirm").onclick =
    openPage;

document.getElementById("back").onclick =
    goBack;

items.forEach((item, index) => {
    item.onclick = () => {
        selected = index;
        updateSelection();
        openPage();
    };
});

bindTennisControls();
pdBindFeedback();
pdBindViewport();
updateSelection();
function startBlinking() {
    const sprite = page.querySelector(".companion-sprite");

    if (!sprite) return;

    const blinkImage = new Image();
    blinkImage.src = "chimp-blink.png";

    function blink() {
        if (
            currentPage !== "companion" ||
            !sprite.isConnected
        ) return;

        if (sprite.getAttribute("src") === "chimp.png") {
            sprite.src = "chimp-blink.png";

            setTimeout(() => {
                if (sprite.getAttribute("src") === "chimp-blink.png") {
                    sprite.src = "chimp.png";
                }
            }, 160);
        }

        setTimeout(blink, 2500 + Math.random() * 4000);
    }

    setTimeout(blink, 3000);
}
function enableCompanionDrag() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");

    let dragging = false;
    let petting = false;
    let pressed = false;
    let holdTimer;
    let fallFrame;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;

    function grab() {
        if (!pressed || dragging) return;

        dragging = true;

        sprite.style.left = sprite.offsetLeft + "px";
        sprite.style.top = sprite.offsetTop + "px";
        sprite.style.bottom = "auto";

        sprite.classList.add("dragging");
        sprite.src = "chimp-grab.png";

        sayCompanion("grab");
    }

    sprite.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || pressed || fallFrame) return;
if (sprite.dataset.busy === "true") return;

        pressed = true;

        startX = event.clientX;
        startY = event.clientY;

        offsetX = event.clientX - sprite.offsetLeft;
        offsetY = event.clientY - sprite.offsetTop;

        sprite.setPointerCapture(event.pointerId);

        holdTimer = setTimeout(grab, 700);
    });

    sprite.addEventListener("pointermove", (event) => {
        if (!pressed) return;

        const distance = Math.hypot(
            event.clientX - startX,
            event.clientY - startY
        );

       if (!dragging && !petting && distance > 4) {
    clearTimeout(holdTimer);

    petting = true;

    sprite.classList.add("petting");
    sprite.src = "chimp-pet.png";

    sayCompanion("pet");
}

if (petting) return;

        if (!dragging) return;

        const x = Math.max(0, Math.min(
            event.clientX - offsetX,
            room.clientWidth - sprite.offsetWidth
        ));

        const y = Math.max(0, Math.min(
            event.clientY - offsetY,
            room.clientHeight - sprite.offsetHeight - 17
        ));

        sprite.style.left = x + "px";
        sprite.style.top = y + "px";
    });

    function release() {
        if (!pressed) return;

        pressed = false;
        clearTimeout(holdTimer);

        if (petting) {
    petting = false;

    sprite.classList.remove("petting");
    sprite.src = "chimp.png";

    return;
}
        if (!dragging) {
            sayCompanion("tap");
            return;
        }

        dragging = false;
        sprite.classList.remove("dragging");

        let velocity = 0;
        let y = sprite.offsetTop;

        const floor = room.clientHeight
            - sprite.offsetHeight - 17;

        function fall() {
            if (!sprite.isConnected ||
                currentPage !== "companion") return;

            velocity += 0.55;
            y += velocity;

            if (y >= Math.max(0,room.clientHeight - sprite.offsetHeight - 17)) {
                sprite.style.top = "auto";
                sprite.style.bottom = "17px";
                sprite.src = "chimp.png";

                fallFrame = null;

                sayCompanion("drop");
                return;
            }

            sprite.style.top = y + "px";

            fallFrame = requestAnimationFrame(fall);
        }

        fall();
    }

    sprite.addEventListener("pointerup", release);
    sprite.addEventListener("pointercancel", release);
}
const companionPhrases = {
    idle: [
        "Чуєш, а в мене є одна ідея",
        "Шось скучно стало",
        "Кароче...",
        "Дай закурить",
        "Може в теніс зіграємо?",
        "Чуєш, а от якщо подумати...",
        "Та хз, шо робити"
    ],
        pet: [
        "О, норм",
        "Ох бля, ше трохи",
        "Оце діло",
        "Та не зупиняйся"
    ],
        tap: [
        "Шо?",
        "Тю блять",
        "Чуєш, ну чого ти тицяєш?",
        "Я тут, я нікуди не дівся"
    ],
    beer: [
        "О, єбать спасіба",
        "Ніхуя",
        "Ну заєбісь"
    ],

    cigarette: [
        "Ох бля",
        "Опа, сіга",
        "Дай закурить"
    ],

    grab: [
        "Е, ти шо робиш?"
    ],

    yawn: [
    "Ох бля...",
    "Шось спати хочеться",
    "Заїбався я"
],

"scratch-butt": [
    "Шо ти дивишся?",
    "О, полегшало",
    "Та не підглядай"
],

"scratch-groin": [
    "Ох бля",
    "Щас, секунду",
    "Та шо таке?"
],

laugh: [
    "Ахахах, єбать",
    "Оце умора",
    "Та ну нахуй"
],

"middle-finger": [
    "На, тримай",
    "Оце тобі",
    "На тобі подарок"
],

cap: [
    "О, отак краще",
    "Ну всьо, красавчик",
    "Порядок"
],

pee: [
    "Бля, відвернись",
    "Щас, я швидко",
    "Ох, нарешті"
],

drop: [
        "Та бля, обережніше!"
    ]
};

function sayCompanion(action) {
    const phrases = companionPhrases[action];

    if (!phrases || currentPage !== "companion") {
        return;
    }

    const dialogue = page.querySelector(
        ".companion-dialogue"
    );

    if (!dialogue) return;

    const random = Math.floor(
        Math.random() * phrases.length
    );

    dialogue.textContent = phrases[random];
}
function enableCompanionItems() {
    const items = page.querySelectorAll(".companion-item");
    const sprite = page.querySelector(".companion-sprite");

    items.forEach(item => {
        let ghost = null;
        let pressed = false;
        let moved = false;
        let startX = 0;
        let startY = 0;

        item.addEventListener("pointerdown", event => {
            if (event.button !== 0) return;

            pressed = true;
            moved = false;

            startX = event.clientX;
            startY = event.clientY;

            item.setPointerCapture(event.pointerId);
        });

        item.addEventListener("pointermove", event => {
            if (!pressed) return;

            const distance = Math.hypot(
                event.clientX - startX,
                event.clientY - startY
            );

            if (!moved && distance > 6) {
                moved = true;

                ghost = document.createElement("div");
                ghost.className = "item-ghost";

                ghost.appendChild(
                    item.querySelector("svg").cloneNode(true)
                );

                document.body.appendChild(ghost);
            }

            if (ghost) {
                ghost.style.left = event.clientX + "px";
                ghost.style.top = event.clientY + "px";
            }
        });

        function finish(event, cancelled = false) {
            if (!pressed) return;

            pressed = false;

            const rect = sprite.getBoundingClientRect();

            const hit =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;

            if (!cancelled && (!moved || hit)) {
                giveCompanionItem(item.dataset.item);
            }

            if (ghost) {
                ghost.remove();
                ghost = null;
            }
        }

        item.addEventListener("pointerup", event => {
            finish(event);
        });

        item.addEventListener("pointercancel", event => {
            finish(event, true);
        });

        item.addEventListener("lostpointercapture", event => {
            finish(event, true);
        });

        item.addEventListener("click", event => {
            if (event.detail === 0) {
                giveCompanionItem(item.dataset.item);
            }
        });
    });
}
function giveCompanionItem(action) {
    const sprite = page.querySelector(".companion-sprite");

    if (!sprite || currentPage !== "companion") return;

    const image = sprite.getAttribute("src");

    if (image !== "chimp.png" &&
        image !== "chimp-blink.png") return;

    if (sprite.dataset.busy === "true") return;

    sayCompanion(action);

    if (action === "cigarette") {
    sprite.dataset.busy = "true";

    sprite.src = "chimp-smoke.png";

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp-smoke-exhale.png";
    }, 1200);

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp-smoke.png";
    }, 2800);

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp.png";
        sprite.dataset.busy = "false";
    }, 4000);

    return;
}

if (action !== "beer") return;

    sprite.dataset.busy = "true";
    sprite.src = "chimp-beer-hold.png";

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp-beer-drink.png";
    }, 600);

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp-beer-hold.png";
    }, 2200);

    setTimeout(() => {
        if (!sprite.isConnected) return;

        sprite.src = "chimp.png";
        sprite.dataset.busy = "false";
    }, 2800);
}
function startCompanionLife() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");
    const items = page.querySelector(".companion-items");

    let lastInteraction = Date.now();

    function rememberInteraction() {
        lastInteraction = Date.now();
    }

    room.addEventListener("pointerdown", rememberInteraction);
    items.addEventListener("pointerdown", rememberInteraction);

    function spontaneousReaction() {
        if (
            currentPage !== "companion" ||
            !sprite.isConnected
        ) return;

        if (
            Date.now() - lastInteraction > 10000 &&
            sprite.dataset.busy !== "true" &&
            !sprite.classList.contains("dragging") &&
            !sprite.classList.contains("petting")
        ) {
            sayCompanion("idle");
        }

        setTimeout(
            spontaneousReaction,
            15000 + Math.random() * 15000
        );
    }

    setTimeout(spontaneousReaction, 15000);
}
function startCompanionWalking() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");
    const items = page.querySelector(".companion-items");

    let animation = 0;
    let touching = false;

    function stopWalking() {
        if (!animation) return;

        cancelAnimationFrame(animation);
        animation = 0;

        sprite.src = "chimp.png";
        sprite.style.scale = "";
        sprite.style.animation = "";
    }

    function startTouch() {
        touching = true;
        stopWalking();
    }

    function endTouch() {
        touching = false;
    }

    [room, items].forEach(element => {
        element.addEventListener("pointerdown", startTouch);
        element.addEventListener("pointerup", endTouch);
        element.addEventListener("pointercancel", endTouch);
        element.addEventListener("lostpointercapture", endTouch);
    });

    function walk() {
        if (!sprite.isConnected ||
            currentPage !== "companion") return;

        if (
            !touching &&
            !animation &&
            sprite.dataset.busy !== "true" &&
            sprite.getAttribute("src") === "chimp.png"
        ) {
            const max = room.clientWidth - sprite.offsetWidth;
            const start = sprite.offsetLeft;

            if (max > 30) {
                const target = start < max / 2
                    ? max - 8
                    : 8;

                const direction = target > start ? 1 : -1;

                sprite.style.scale =
                    direction === 1 ? "1 1" : "-1 1";

                sprite.style.animation = "none";
                sprite.style.top = "auto";
                sprite.style.bottom = "17px";

                const started = performance.now();

                function move(now) {
                    if (!sprite.isConnected ||
                        currentPage !== "companion") {
                        stopWalking();
                        return;
                    }

                    const elapsed = now - started;

                    const duration = Math.max(
                        400,
                        Math.abs(target - start) * 13
                    );

                    const progress = Math.min(
                        elapsed / duration,
                        1
                    );

                    sprite.style.left =
                        Math.max(0,Math.min(room.clientWidth-sprite.offsetWidth,start + (target - start) * progress)) + "px";

                    const frame = Math.floor(elapsed / 160) % 2;

                    const image = frame === 0
                        ? "chimp-walk-1.png"
                        : "chimp-walk-2.png";

                    if (sprite.getAttribute("src") !== image) {
                        sprite.src = image;
                    }

                    if (progress >= 1) {
                        stopWalking();
                        return;
                    }

                    animation = requestAnimationFrame(move);
                }

                animation = requestAnimationFrame(move);
            }
        }

        setTimeout(walk, 8000 + Math.random() * 6000);
    }

    setTimeout(walk, 5000);
}
function startCompanionSitting() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");
    const items = page.querySelector(".companion-items");

    let sitting = false;
    let touching = false;
    let sitTimer;

    function standUp() {
        if (!sitting) return;

        sitting = false;
        clearTimeout(sitTimer);

        sprite.dataset.busy = "false";

        if (sprite.getAttribute("src") === "chimp-sit.png") {
            sprite.src = "chimp.png";
        }
    }

    function onTouch() {
        touching = true;
        standUp();
    }

    function onRelease() {
        touching = false;
    }

    [room, items].filter(Boolean).forEach(element => {
        element.addEventListener("pointerdown", onTouch, true);
        element.addEventListener("pointerup", onRelease);
        element.addEventListener("pointercancel", onRelease);
        element.addEventListener("lostpointercapture", onRelease);
    });

    function sitDown() {
        if (!sprite.isConnected || currentPage !== "companion") {
            return;
        }

        if (
            !touching &&
            !sitting &&
            sprite.dataset.busy !== "true" &&
            sprite.getAttribute("src") === "chimp.png"
        ) {
            sitting = true;
            sprite.dataset.busy = "true";
            sprite.src = "chimp-sit.png";

            sitTimer = setTimeout(
                standUp,
                6000 + Math.random() * 4000
            );
        }

        setTimeout(
            sitDown,
            15000 + Math.random() * 10000
        );
    }

    setTimeout(sitDown, 12000);
}
function startCompanionSleeping() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");
    const items = page.querySelector(".companion-items");

    let sleeping = false;
    let touching = false;
    let wakeTimer;
    let lastInteraction = Date.now();

    function wakeUp() {
        lastInteraction = Date.now();

        if (!sleeping) return;

        sleeping = false;
        clearTimeout(wakeTimer);
        sprite.dataset.busy = "false";

        if (sprite.getAttribute("src") === "chimp-sleep.png") {
    sayCompanion("wake");
            sprite.src = "chimp.png";
        }
    }

    function onTouch() {
        touching = true;
        wakeUp();
    }

    function onRelease() {
        touching = false;
        lastInteraction = Date.now();
    }

    [room, items].filter(Boolean).forEach(element => {
        element.addEventListener("pointerdown", onTouch, true);
        element.addEventListener("pointerup", onRelease);
        element.addEventListener("pointercancel", onRelease);
        element.addEventListener("lostpointercapture", onRelease);
    });

    function checkSleep() {
        if (!sprite.isConnected || currentPage !== "companion") {
            return;
        }

        if (
            !touching &&
            !sleeping &&
            Date.now() - lastInteraction >= 30000 &&
            sprite.dataset.busy !== "true" &&
            sprite.getAttribute("src") === "chimp.png"
        ) {
            sleeping = true;
            sprite.dataset.busy = "true";
            sprite.src = "chimp-sleep.png";
sayCompanion("sleep");

            wakeTimer = setTimeout(
                wakeUp,
                12000 + Math.random() * 8000
            );
        }

        setTimeout(checkSleep, 3000);
    }

    setTimeout(checkSleep, 3000);
}
function startCompanionActions() {
    const sprite = page.querySelector(".companion-sprite");
    const room = page.querySelector(".companion-room");
    const items = page.querySelector(".companion-items");

    const actions = [
        { image: "chimp-yawn.png", duration: 1800 },
{ image: "chimp-scratch-butt.png", duration: 2200 },
{ image: "chimp-scratch-groin.png", duration: 2000 },
{ image: "chimp-laugh.png", duration: 2200 },
{ image: "chimp-middle-finger.png", duration: 2500 },
{ image: "chimp-cap.png", duration: 1500 },
{ image: "chimp-pee.png", duration: 4000 }
    ];

    let active = false;
    let touching = false;
    let actionTimer;

    function stopAction() {
        if (!active) return;

        active = false;
        clearTimeout(actionTimer);
        sprite.src = "chimp.png";
        sprite.dataset.busy = "false";
    }

    [room, items].filter(Boolean).forEach(element => {
        element.addEventListener("pointerdown", () => {
            touching = true;
            stopAction();
        }, true);

        ["pointerup", "pointercancel", "lostpointercapture"]
            .forEach(event => {
                element.addEventListener(event, () => {
                    touching = false;
                });
            });
    });

    function playAction() {
        if (!sprite.isConnected || currentPage !== "companion") {
            return;
        }

        if (
            !touching &&
            !active &&
            sprite.dataset.busy !== "true" &&
            sprite.getAttribute("src") === "chimp.png"
        ) {
            const action = actions[
                Math.floor(Math.random() * actions.length)
            ];

            active = true;
            sprite.dataset.busy = "true";
            sprite.src = action.image;

sayCompanion(
    action.image
        .replace("chimp-", "")
        .replace(".png", "")
);

            actionTimer = setTimeout(
                stopAction,
                action.duration
            );
        }

        setTimeout(
            playAction,
            7000 + Math.random() * 8000
        );
    }

    let interactionHistory = [];

sprite.addEventListener("pointerup", () => {
    const now = Date.now();

    interactionHistory = interactionHistory.filter(
        time => now - time < 12000
    );

    interactionHistory.push(now);

    if (interactionHistory.length < 5) return;

    interactionHistory = [];

    setTimeout(() => {
        if (!sprite.isConnected ||
            currentPage !== "companion") return;

        sayCompanion("annoyed");

        if (
            !active &&
            !touching &&
            sprite.dataset.busy !== "true" &&
            sprite.getAttribute("src") === "chimp.png"
        ) {
            active = true;
            sprite.dataset.busy = "true";
            sprite.src = "chimp-middle-finger.png";

            actionTimer = setTimeout(stopAction, 2500);
        }
    }, 100);
});

setTimeout(playAction, 7000);
}
Object.entries({
    idle: [
        "Такий день сьогодні...",
        "Чуєш, а ти де пропадаєш?",
        "Єбать, оце тиша",
        "Піздєц скучно",
        "Слухай сюди",
        "А хоча похуй",
        "Шось я задумався",
        "От нахуй воно мені треба?",
        "Чуєш, є діло",
        "Та ну його",
        "Оце я встряв",
        "І шо тепер?",
        "Буває й таке",
        "Оце життя пішло",
        "Ну і хулі?",
        "Та я чисто подумав",
        "Ладно, проїхали",
        "Всьо під контролем"
    ],

    pet: [
        "О, заєбісь",
        "Та отак, да",
        "Ще чуть-чуть",
        "Оце я понімаю",
        "Можеш продовжувати"
    ],

    tap: [
        "Ну?",
        "Шо опять?",
        "Та чекай ти",
        "Я тебе слухаю",
        "Не тікай, щас скажу"
    ],

    grab: [
        "Е, постав назад!",
        "Куди нахуй?",
        "Ти шо, ахуєв?",
        "Бля, пусти!",
        "Я тобі шо, іграшка?"
    ],

    drop: [
        "Ай, блять!",
        "Ну ти й мудак",
        "Поняв, прийняв",
        "Ледь не обісрався",
        "Я тобі це припомню"
    ],

    beer: [
        "О, це по-нашому",
        "За твоє здоров'я",
        "Ну нарешті",
        "Красавчик"
    ],

    cigarette: [
        "Якраз вчасно",
        "О, дякую",
        "Ну давай сюди",
        "Щас постою"
    ],

    yawn: [
        "Боже, як мене рубить",
        "Пора відпочити"
    ],

    "scratch-butt": [
        "Та буває",
        "Не твоє діло"
    ],

    "scratch-groin": [
        "Ой бля..."
    ],

    laugh: [
        "Я щас здохну",
        "Оце ти видав"
    ],

    "middle-finger": [
        "З любов'ю"
    ],

    cap: [
        "Стиль є стиль"
    ],

    pee: [
        "Не стой над душею"
    ]

}).forEach(([key, phrases]) => {
    if (companionPhrases[key]) {
        companionPhrases[key].push(...phrases);
    }
});
Object.assign(companionPhrases, {
    morning: [
        "О, добрий ранок",
        "Вже встав?",
        "Ну шо, проснулися?",
        "Бля, ще б поспати"
    ],

    day: [
        "Ну шо, здоров!",
        "О, ти тут",
        "Як воно?",
        "Шо сьогодні робимо?"
    ],

    evening: [
        "О, добрий вечір",
        "Ну шо, як день?",
        "Заїбався за сьогодні?",
        "Пора відпочивати"
    ],

    night: [
        "Ти чого не спиш?",
        "Бля, глянь на годину",
        "Совість май, ніч надворі",
        "О, нічний житель"
    ],

    sleep: [
        "Все, я вирубаюсь",
        "Не чіпай мене",
        "Піду посплю",
        "Всьо, відбій"
    ],

    wake: [
        "Котра нахуй година?",
        "Шо сталося?",
        "Ох бля, я аж заснув",
        "Та встав я, встав"
    ]
});

function greetCompanion() {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
        sayCompanion("morning");
    } else if (hour >= 12 && hour < 18) {
        sayCompanion("day");
    } else if (hour >= 18 && hour < 23) {
        sayCompanion("evening");
    } else {
        sayCompanion("night");
    }
}
companionPhrases.annoyed = [
    "Та заїбав ти вже",
    "Дай мені спокій",
    "Тобі робити ніхуя?",
    "Та від'їбись на секунду",
    "Шо ти до мене доїбався?",
    "Іди займись чимось",
    "Ну всьо, нахуй"
];