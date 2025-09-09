// Recuperar datos del LocalStorage
let infoArray = JSON.parse(localStorage.getItem("infoData")) || [];

const form = document.getElementById('dataForm');
const infoList = document.getElementById('infoList');
const search = document.getElementById('search');

// Renderizar información en pantalla
function renderInfo(data = infoArray) {
    infoList.innerHTML = "";

    if (data.length === 0) {
        infoList.innerHTML = "<p>No hay información guardada.</p>";
        return;
    }

    data.forEach((item, index) => {
        const infoItem = document.createElement('div');
        infoItem.classList.add('info-item');
        infoItem.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.content}</p>
            <div class="actions">
                <button onclick="editInfo(${index})">Editar</button>
                <button onclick="deleteInfo(${index})">Eliminar</button>
            </div>
        `;
        infoList.appendChild(infoItem);
    });
}

// Guardar en LocalStorage
function saveToLocalStorage() {
    localStorage.setItem("infoData", JSON.stringify(infoArray));
}

// Agregar información
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    if (title && content) {
        infoArray.push({ title, content });
        saveToLocalStorage();
        renderInfo();

        // Limpiar formulario
        form.reset();
    }
});

// Eliminar información
function deleteInfo(index) {
    infoArray.splice(index, 1);
    saveToLocalStorage();
    renderInfo();
}

// Editar información
function editInfo(index) {
    const newTitle = prompt("Editar título:", infoArray[index].title);
    const newContent = prompt("Editar contenido:", infoArray[index].content);

    if (newTitle && newContent) {
        infoArray[index] = { title: newTitle, content: newContent };
        saveToLocalStorage();
        renderInfo();
    }
}

// Buscar información
search.addEventListener("input", function() {
    const filtered = infoArray.filter(item =>
        item.title.toLowerCase().includes(search.value.toLowerCase())
    );
    renderInfo(filtered);
});

// Inicializar
renderInfo();
