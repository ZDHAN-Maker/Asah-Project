// main.js

const STORAGE_KEY = "BOOKSHELF_APP";
let books = [];

// Cek apakah browser mendukung localStorage
function isStorageExist() {
  return typeof Storage !== "undefined";
}

// Simpan data ke localStorage
function saveData() {
  if (isStorageExist()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }
}

// Ambil data dari localStorage
function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    books = JSON.parse(data);
  }
}

// Render ulang tampilan buku di rak
function renderBooks() {
  const incompleteList = document.getElementById("incompleteBookList");
  const completeList = document.getElementById("completeBookList");

  incompleteList.innerHTML = "";
  completeList.innerHTML = "";

  books.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.setAttribute("data-bookid", book.id);
    bookItem.setAttribute("data-testid", "bookItem");

    const bookTitle = document.createElement("h3");
    bookTitle.setAttribute("data-testid", "bookItemTitle");
    bookTitle.innerText = book.title;

    const bookId = document.createElement("p");
    bookId.setAttribute("data-testid", "bookItemId");
    bookId.innerText = `ID: ${book.id}`;

    const bookAuthor = document.createElement("p");
    bookAuthor.setAttribute("data-testid", "bookItemAuthor");
    bookAuthor.innerText = `Penulis: ${book.author}`;

    const bookYear = document.createElement("p");
    bookYear.setAttribute("data-testid", "bookItemYear");
    bookYear.innerText = `Tahun: ${book.year}`;

    const actionContainer = document.createElement("div");

    const toggleButton = document.createElement("button");
    toggleButton.setAttribute("data-testid", "bookItemIsCompleteButton");
    toggleButton.innerText = book.isComplete
      ? "Belum selesai dibaca"
      : "Selesai dibaca";
    toggleButton.addEventListener("click", () => {
      book.isComplete = !book.isComplete;
      saveData();
      renderBooks();
    });

    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
    deleteButton.innerText = "Hapus Buku";
    deleteButton.addEventListener("click", () => {
      books = books.filter((b) => b.id !== book.id);
      saveData();
      renderBooks();
    });

    const editButton = document.createElement("button");
    editButton.setAttribute("data-testid", "bookItemEditButton");
    editButton.innerText = "Edit Buku";
    editButton.addEventListener("click", () => {
      document.getElementById("bookFormTitle").value = book.title;
      document.getElementById("bookFormAuthor").value = book.author;
      document.getElementById("bookFormYear").value = book.year;
      document.getElementById("bookFormIsComplete").checked = book.isComplete;

      books = books.filter((b) => b.id !== book.id);
      saveData();
      renderBooks();
    });

    actionContainer.append(toggleButton, deleteButton, editButton);

    bookItem.append(bookTitle,bookId, bookAuthor, bookYear, actionContainer);

    if (book.isComplete) {
      completeList.appendChild(bookItem);
    } else {
      incompleteList.appendChild(bookItem);
    }
  });
}

// Tambah buku baru
function addBook(title, author, year, isComplete) {
  const id = Number(new Date())
<<<<<<< HEAD
  const book = { id, title, author, year, isComplete };
=======
  const book = { id, title, author, year: Number(year), isComplete };
>>>>>>> 841db8d (membuat web personal notes)
  books.push(book);
  saveData();
  renderBooks();
}

// Event: submit form tambah buku
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderBooks();

  const form = document.getElementById("bookForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("bookFormTitle").value;
    const author = document.getElementById("bookFormAuthor").value;
<<<<<<< HEAD
    const year = document.getElementById("bookFormYear").value;
=======
    const year = Number(document.getElementById("bookFormYear").value);
>>>>>>> 841db8d (membuat web personal notes)
    const isComplete = document.getElementById("bookFormIsComplete").checked;

    addBook(title, author, year, isComplete);

    form.reset();
  });

  // Event: cari buku
  const searchForm = document.getElementById("searchBook");
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyword = document
      .getElementById("searchBookTitle")
      .value.toLowerCase();

    const filteredBooks = books.filter((book) =>
      book.title.toLowerCase().includes(keyword)
    );

    const incompleteList = document.getElementById("incompleteBookList");
    const completeList = document.getElementById("completeBookList");
    incompleteList.innerHTML = "";
    completeList.innerHTML = "";

    filteredBooks.forEach((book) => {
      const bookItem = document.createElement("div");
      bookItem.setAttribute("data-bookid", book.id);
      bookItem.setAttribute("data-testid", "bookItem");

      const bookTitle = document.createElement("h3");
      bookTitle.setAttribute("data-testid", "bookItemTitle");
      bookTitle.innerText = book.title;

      const bookId = document.createElement("p");
      bookId.setAttribute("data-testid", "bookItemId");
      bookId.innerText = `ID: ${book.id}`;

      const bookAuthor = document.createElement("p");
      bookAuthor.setAttribute("data-testid", "bookItemAuthor");
      bookAuthor.innerText = `Penulis: ${book.author}`;

      const bookYear = document.createElement("p");
      bookYear.setAttribute("data-testid", "bookItemYear");
      bookYear.innerText = `Tahun: ${book.year}`;

      const actionContainer = document.createElement("div");

      const toggleButton = document.createElement("button");
      toggleButton.setAttribute("data-testid", "bookItemIsCompleteButton");
      toggleButton.innerText = book.isComplete
        ? "Belum selesai dibaca"
        : "Selesai dibaca";
      toggleButton.addEventListener("click", () => {
        book.isComplete = !book.isComplete;
        saveData();
        renderBooks();
      });

      const deleteButton = document.createElement("button");
      deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
      deleteButton.innerText = "Hapus Buku";
      deleteButton.addEventListener("click", () => {
        books = books.filter((b) => b.id !== book.id);
        saveData();
        renderBooks();
      });

      const editButton = document.createElement("button");
      editButton.setAttribute("data-testid", "bookItemEditButton");
      editButton.innerText = "Edit Buku";
      editButton.addEventListener("click", () => {
        document.getElementById("bookFormTitle").value = book.title;
        document.getElementById("bookFormAuthor").value = book.author;
        document.getElementById("bookFormYear").value = book.year;
        document.getElementById("bookFormIsComplete").checked = book.isComplete;
        books = books.filter((b) => b.id !== book.id);
        saveData();
        renderBooks();
      });

      actionContainer.append(toggleButton, deleteButton, editButton);

      bookItem.append(bookTitle, bookId,bookAuthor, bookYear, actionContainer);

      if (book.isComplete) {
        completeList.appendChild(bookItem);
      } else {
        incompleteList.appendChild(bookItem);
      }
    });
  });
});
