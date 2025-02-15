// Efecto de scroll en el navbar
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

class TestCreator {
  constructor() {
    this.questions = [];
    this.currentFormat = {
      pageSize: "A4",
      font: "Times New Roman",
      titleSize: "24px",
      questionSize: "16px",
      answerSize: "14px",
      lineHeight: "1.5",
    };

    this.initializeEventListeners();
    this.initializeToggles();
    this.questionCount = 0;
    this.deletedQuestions = new Set();
  }

  initializeEventListeners() {
    // Botón para agregar pregunta
    document
      .getElementById("addQuestion")
      .addEventListener("click", () => this.addNewQuestion());

    // Cambios en el formato
    document
      .getElementById("pageSize")
      .addEventListener("change", (e) =>
        this.updateFormat("pageSize", e.target.value)
      );
    document
      .getElementById("fontFamily")
      .addEventListener("change", (e) =>
        this.updateFormat("font", e.target.value)
      );

    // Botón para generar PDF
    document
      .getElementById("generatePDF")
      .addEventListener("click", () => this.generatePDF());

    // Botón para imprimir
    document
      .getElementById("printTest")
      .addEventListener("click", () => this.printTest());
  }

  initializeToggles() {
    // Toggle para texto de apoyo
    const toggleSupportText = document.getElementById("toggleSupportText");
    const supportTextContainer = document.getElementById(
      "supportTextContainer"
    );

    toggleSupportText.addEventListener("click", () => {
      const isHidden = supportTextContainer.classList.contains("hidden");
      supportTextContainer.classList.toggle("hidden");
      toggleSupportText.setAttribute("aria-expanded", !isHidden);
      toggleSupportText.querySelector(".toggle-icon").textContent = isHidden
        ? "−"
        : "+";
    });

    // Toggle para subtítulo
    const toggleSubtitle = document.getElementById("toggleSubtitle");
    const subtitleContainer = document.getElementById("subtitleContainer");

    toggleSubtitle.addEventListener("click", () => {
      const isHidden = subtitleContainer.classList.contains("hidden");
      subtitleContainer.classList.toggle("hidden");
      toggleSubtitle.setAttribute("aria-expanded", !isHidden);
      toggleSubtitle.querySelector(".toggle-icon").textContent = isHidden
        ? "−"
        : "+";
    });
  }

  updateFormat(property, value) {
    // Mapear los nombres de fuentes a los nombres que jsPDF utiliza
    if (property === "font") {
      switch (value) {
        case "Times New Roman":
          value = "times";
          break;
        case "Arial":
          value = "helvetica";
          break;
        case "Courier New":
          value = "courier";
          break;
        default:
          value = "helvetica";
      }
    }

    // Mapear los tamaños de página a los formatos que jsPDF utiliza
    if (property === "pageSize") {
      switch (value) {
        case "Letter":
          value = "letter";
          break;
        case "Legal":
          value = "legal";
          break;
        default:
          value = "a4";
      }
    }

    this.currentFormat[property] = value;
  }

  getNextQuestionNumber() {
    if (this.deletedQuestions.size > 0) {
      const nextNumber = Math.min(...this.deletedQuestions);
      this.deletedQuestions.delete(nextNumber);
      return nextNumber;
    }
    this.questionCount++;
    return this.questionCount;
  }

  addNewQuestion() {
    const questionNumber = this.getNextQuestionNumber();
    const questionId = Date.now();
    const questionHTML = `
            <div class="question-container" id="question-${questionId}" data-question-number="${questionNumber}">
                <div class="question-header">
                    <span class="question-number">Pregunta ${questionNumber}</span>
                    <div class="question-type-container">
                        <select class="form-control question-type" style="width: auto;" onchange="testCreator.handleQuestionTypeChange(${questionId})">
                            <option value="single">Respuesta Única</option>
                            <option value="multiple">Opción Múltiple</option>
                        </select>
                        <button class="btn btn-secondary" onclick="testCreator.insertImage(${questionId})">
                            📷 Insertar Imagen
                        </button>
                    </div>
                </div>
                <input type="text" class="form-control question-text" placeholder="Escribe tu pregunta aquí">
                <div class="image-container" id="image-container-${questionId}"></div>
                <div class="answers-container">
                    <div class="answer-option">
                        <input type="text" class="form-control" placeholder="Escribe la respuesta">
                        <input type="radio" name="correct-${questionId}" checked>
                        <span class="correct-answer-indicator">✓ Respuesta correcta</span>
                        <div class="answer-controls">
                            <button class="btn-icon btn-delete" onclick="testCreator.removeAnswerOption(this)">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
                <div class="question-controls">
                    <button class="btn" onclick="testCreator.addAnswerOption(${questionId})">
                        + Agregar Opción
                    </button>
                    <div>
                        <button class="btn btn-secondary" onclick="testCreator.removeAllOptions(${questionId})">
                            Eliminar Todas las Opciones
                        </button>
                        <button class="btn btn-danger" onclick="testCreator.removeQuestion(${questionId})">
                            🗑️ Eliminar Pregunta
                        </button>
                    </div>
                </div>
            </div>
        `;

    document
      .getElementById("questionsContainer")
      .insertAdjacentHTML("beforeend", questionHTML);

    // Configurar el evento para la primera opción
    const questionContainer = document.getElementById(`question-${questionId}`);
    const firstOption = questionContainer.querySelector(".answer-option");
    const radioCheckbox = firstOption.querySelector('input[type="radio"]');

    radioCheckbox.addEventListener("change", () => {
      const answersContainer =
        questionContainer.querySelector(".answers-container");
      answersContainer.querySelectorAll(".answer-option").forEach((option) => {
        const indicator = option.querySelector(".correct-answer-indicator");
        const isChecked = option.querySelector('input[type="radio"]').checked;

        indicator.style.display = isChecked ? "inline" : "none";
      });
    });

    // Hacer scroll hasta la nueva pregunta
    questionContainer.scrollIntoView({ behavior: "smooth" });
  }

  handleQuestionTypeChange(questionId) {
    const questionContainer = document.getElementById(`question-${questionId}`);
    const questionType =
      questionContainer.querySelector(".question-type").value;
    const answersContainer =
      questionContainer.querySelector(".answers-container");
    const addAnswerBtn = questionContainer.querySelector(".btn");

    // Limpiar respuestas existentes
    answersContainer.innerHTML = "";

    // Agregar primera opción
    const inputType = questionType === "single" ? "radio" : "checkbox";
    const answerHTML = `
            <div class="answer-option">
                <input type="text" class="form-control" placeholder="Escribe la respuesta correcta">
                <input type="${inputType}" name="correct-${questionId}" checked>
                <span class="correct-answer-indicator">✓ Respuesta correcta</span>
                <div class="answer-controls">
                    <button class="btn-icon btn-delete" onclick="testCreator.removeAnswerOption(this)">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    answersContainer.insertAdjacentHTML("beforeend", answerHTML);

    // Configurar el evento para la primera opción
    const firstOption = answersContainer.querySelector(".answer-option");
    const radioCheckbox = firstOption.querySelector(
      `input[type="${inputType}"]`
    );

    radioCheckbox.addEventListener("change", () => {
      if (questionType === "single") {
        answersContainer
          .querySelectorAll(".answer-option")
          .forEach((option) => {
            const indicator = option.querySelector(".correct-answer-indicator");
            const isChecked = option.querySelector(
              `input[type="${inputType}"]`
            ).checked;

            indicator.style.display = isChecked ? "inline" : "none";
          });
      }
    });
  }

  validateQuestion(questionContainer) {
    const questionText = questionContainer.querySelector(".question-text");
    const answersContainer =
      questionContainer.querySelector(".answers-container");
    let isValid = true;

    // Validar texto de la pregunta
    if (!questionText.value.trim()) {
      this.showError(questionText, "La pregunta no puede estar vacía");
      isValid = false;
    } else {
      this.clearError(questionText);
    }

    // Validar que al menos una respuesta esté marcada como correcta y tenga texto
    const correctAnswers = answersContainer.querySelectorAll(
      'input[type="radio"]:checked, input[type="checkbox"]:checked'
    );
    const hasCorrectAnswer = Array.from(correctAnswers).some((input) => {
      const answerText = input
        .closest(".answer-option")
        .querySelector('input[type="text"]')
        .value.trim();
      return answerText !== "";
    });

    if (!hasCorrectAnswer) {
      const firstAnswer = answersContainer.querySelector(
        '.answer-option input[type="text"]'
      );
      this.showError(
        firstAnswer,
        "Debe haber al menos una respuesta correcta con texto"
      );
      isValid = false;
    }

    // Validar que todas las respuestas tengan texto
    answersContainer.querySelectorAll(".answer-option").forEach((option) => {
      const textInput = option.querySelector('input[type="text"]');
      if (!textInput.value.trim()) {
        this.showError(textInput, "La respuesta no puede estar vacía");
        isValid = false;
      } else {
        this.clearError(textInput);
      }
    });

    return isValid;
  }

  showError(element, message) {
    element.classList.add("error");

    // Crear o actualizar mensaje de error
    let errorMessage = element.nextElementSibling;
    if (!errorMessage || !errorMessage.classList.contains("error-message")) {
      errorMessage = document.createElement("div");
      errorMessage.className = "error-message";
      element.parentNode.insertBefore(errorMessage, element.nextSibling);
    }
    errorMessage.textContent = message;
    errorMessage.style.display = "block";

    // Añadir animación de shake
    element.classList.add("error-shake");
    setTimeout(() => element.classList.remove("error-shake"), 500);
  }

  clearError(element) {
    element.classList.remove("error");
    const errorMessage = element.nextElementSibling;
    if (errorMessage && errorMessage.classList.contains("error-message")) {
      errorMessage.style.display = "none";
    }
  }

  addAnswerOption(questionId) {
    const questionContainer = document.getElementById(`question-${questionId}`);
    if (!this.validateQuestion(questionContainer)) {
      return;
    }
    const questionType =
      questionContainer.querySelector(".question-type").value;
    const answersContainer =
      questionContainer.querySelector(".answers-container");
    const inputType = questionType === "single" ? "radio" : "checkbox";

    const answerHTML = `
            <div class="answer-option">
                <input type="text" class="form-control" placeholder="Escribe una opción de respuesta">
                <input type="${inputType}" name="correct-${questionId}">
                <span class="correct-answer-indicator" style="display: none">✓ Respuesta correcta</span>
                <div class="answer-controls">
                    <button class="btn-icon btn-delete" onclick="testCreator.removeAnswerOption(this)">
                        🗑️
                    </button>
                </div>
            </div>
        `;

    answersContainer.insertAdjacentHTML("beforeend", answerHTML);

    // Manejar la selección de respuesta correcta
    const newAnswer = answersContainer.lastElementChild;
    const radioCheckbox = newAnswer.querySelector(`input[type="${inputType}"]`);

    radioCheckbox.addEventListener("change", () => {
      if (questionType === "single") {
        // Para respuesta única, actualizar todos los indicadores
        answersContainer
          .querySelectorAll(".answer-option")
          .forEach((option) => {
            const indicator = option.querySelector(".correct-answer-indicator");
            const isChecked = option.querySelector(
              `input[type="${inputType}"]`
            ).checked;

            indicator.style.display = isChecked ? "inline" : "none";
          });
      } else {
        // Para opción múltiple, solo actualizar el indicador actual
        const indicator = newAnswer.querySelector(".correct-answer-indicator");
        indicator.style.display = radioCheckbox.checked ? "inline" : "none";
      }
    });

    // Observar cambios en la nueva opción
    newAnswer
      .querySelector('input[type="text"]')
      .addEventListener("input", () => this.renderPreview());

    this.renderPreview();
  }

  removeQuestion(questionId) {
    const questionContainer = document.getElementById(`question-${questionId}`);
    const questionNumber = parseInt(questionContainer.dataset.questionNumber);

    // Agregar el número a la lista de números disponibles
    this.deletedQuestions.add(questionNumber);

    // Eliminar la pregunta
    questionContainer.remove();

    // Actualizar el contador si se eliminó la última pregunta
    if (
      questionNumber === this.questionCount &&
      this.deletedQuestions.size === 0
    ) {
      this.questionCount--;
    }

    this.renderPreview();
  }

  insertImage(questionId) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageContainer = document.getElementById(
            `image-container-${questionId}`
          );

          // Crear diálogo para ajustar el tamaño
          const dialog = document.createElement("div");
          dialog.className = "image-dialog";
          dialog.innerHTML = `
                        <div class="image-dialog-content">
                            <h4>Ajustar tamaño de imagen</h4>
                            <div class="image-preview">
                                <img src="${event.target.result}" style="max-width: 300px;">
                            </div>
                            <div class="size-controls">
                                <div class="size-input">
                                    <label>Ancho (cm):</label>
                                    <input type="number" id="width-input" value="1.5" min="1" max="18" step="0.5">
                                </div>
                                <div class="size-input">
                                    <label>Alto (cm):</label>
                                    <input type="number" id="height-input" value="1.5" min="1" max="25" step="0.5">
                                </div>
                            </div>
                            <div class="dialog-buttons">
                                <button class="btn btn-secondary" onclick="testCreator.closeImageDialog()">Cancelar</button>
                                <button class="btn btn-primary" onclick="testCreator.insertSizedImage('${questionId}', '${event.target.result}')">Insertar</button>
                            </div>
                        </div>
                    `;

          const overlay = document.createElement("div");
          overlay.className = "dialog-overlay";
          overlay.onclick = () => this.closeImageDialog();

          document.body.appendChild(overlay);
          document.body.appendChild(dialog);
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }

  closeImageDialog() {
    const dialog = document.querySelector(".image-dialog");
    const overlay = document.querySelector(".dialog-overlay");
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
  }

  insertSizedImage(questionId, imageData) {
    const width = document.getElementById("width-input").value;
    const height = document.getElementById("height-input").value;

    const imageContainer = document.getElementById(
      `image-container-${questionId}`
    );
    imageContainer.innerHTML = `
            <div class="question-image-container">
                <img src="${imageData}" 
                     style="width: ${width}cm; height: ${height}cm; object-fit: contain;"
                     data-original="${imageData}">
                <button class="btn btn-danger btn-remove-image" onclick="testCreator.removeImage('${questionId}')">
                    🗑️ Eliminar imagen
                </button>
            </div>
        `;

    this.closeImageDialog();
  }

  removeImage(questionId) {
    const imageContainer = document.getElementById(
      `image-container-${questionId}`
    );
    imageContainer.innerHTML = "";
  }

  generatePDF() {
    // Validar todas las preguntas antes de generar el PDF
    const questions = document.querySelectorAll(".question-container");
    let isValid = true;

    questions.forEach((question) => {
      if (!this.validateQuestion(question)) {
        isValid = false;
      }
    });

    if (!isValid) {
      const errorTooltip = document.createElement("div");
      errorTooltip.className = "validation-tooltip";
      errorTooltip.textContent =
        "Por favor, corrija los errores antes de generar el PDF";
      document.body.appendChild(errorTooltip);

      const generateButton = document.getElementById("generatePDF");
      const rect = generateButton.getBoundingClientRect();
      errorTooltip.style.top = `${rect.top - 40}px`;
      errorTooltip.style.left = `${rect.left}px`;
      errorTooltip.style.opacity = "1";

      setTimeout(() => {
        errorTooltip.style.opacity = "0";
        setTimeout(() => errorTooltip.remove(), 300);
      }, 3000);

      return;
    }

    const { jsPDF } = window.jspdf;

    // Configurar el tamaño de página
    const pageConfig = {
      format: this.currentFormat.pageSize.toLowerCase(),
      orientation: "portrait",
    };

    const doc = new jsPDF(pageConfig);
    const answerDoc = new jsPDF(pageConfig);

    // Configurar la fuente
    doc.setFont(this.currentFormat.font);
    answerDoc.setFont(this.currentFormat.font);

    // Configuración de márgenes
    const margins = {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20,
    };

    const pageWidth = doc.internal.pageSize.width;
    const textWidth = pageWidth - margins.left - margins.right;

    // Función para manejar texto largo y saltos de página
    const addWrappedText = (text, x, y, pdfDoc, fontSize = 12) => {
      pdfDoc.setFontSize(fontSize);
      const lines = pdfDoc.splitTextToSize(text, textWidth);
      let currentY = y;

      lines.forEach((line) => {
        if (currentY > pdfDoc.internal.pageSize.height - margins.bottom) {
          pdfDoc.addPage();
          currentY = margins.top;
        }
        pdfDoc.text(line, x, currentY);
        currentY += fontSize * 0.5;
      });

      return currentY + fontSize * 0.3;
    };

    // Configuración común para ambos documentos
    const configureDocument = (pdfDoc, title) => {
      pdfDoc.setFont(this.currentFormat.font);
      pdfDoc.setFontSize(parseInt(this.currentFormat.titleSize));

      const titleWidth =
        (pdfDoc.getStringUnitWidth(title) *
          parseInt(this.currentFormat.titleSize)) /
        pdfDoc.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;

      pdfDoc.text(title, titleX, margins.top);
      return margins.top + parseInt(this.currentFormat.titleSize) * 0.5;
    };

    let yPosition = configureDocument(
      doc,
      document.getElementById("testTitle").value || "Test"
    );
    let answerYPosition = configureDocument(
      answerDoc,
      "Hoja de Respuestas Correctas"
    );

    // Agregar subtítulo centrado si existe
    const subtitle = document.getElementById("testSubtitle");
    if (
      !subtitle.parentElement.classList.contains("hidden") &&
      subtitle.value
    ) {
      doc.setFontSize(14);
      const subtitleWidth =
        (doc.getStringUnitWidth(subtitle.value) * 14) /
        doc.internal.scaleFactor;
      const subtitleX = (pageWidth - subtitleWidth) / 2;
      doc.text(subtitle.value, subtitleX, yPosition);
      yPosition += 10;
    }

    // Agregar texto de apoyo
    const supportTextTitle = document.getElementById("supportTextTitle");
    const supportText = document.getElementById("supportText");
    if (!supportTextTitle.parentElement.classList.contains("hidden")) {
      if (supportTextTitle.value) {
        yPosition = addWrappedText(
          supportTextTitle.value,
          margins.left,
          yPosition,
          doc,
          12
        );
      }
      if (supportText.innerHTML) {
        yPosition = addWrappedText(
          supportText.innerHTML.replace(/<[^>]*>/g, ""),
          margins.left,
          yPosition,
          doc,
          10
        );
        yPosition += 5;
      }
    }

    // Procesar preguntas ordenadas por número
    const sortedQuestions = Array.from(questions).sort((a, b) => {
      const numA = parseInt(a.dataset.questionNumber);
      const numB = parseInt(b.dataset.questionNumber);
      return numA - numB;
    });

    // Modificar el procesamiento de texto para manejar fracciones
    const processText = (text) => {
      // Buscar patrones de fracción (n/d)
      return text.replace(/(\d+)\/(\d+)/g, (match, num, den) => {
        return `${num}/${den}`; // Mantener el formato de fracción en el PDF
      });
    };

    const addImageToPDF = (doc, imageContainer, yPosition) => {
      if (!imageContainer || !imageContainer.querySelector("img"))
        return yPosition;

      const img = imageContainer.querySelector("img");
      const width = parseFloat(img.style.width);
      const height = parseFloat(img.style.height);

      // Convertir cm a puntos (1 cm = 28.35 puntos)
      const widthPt = width * 28.35;
      const heightPt = height * 28.35;

      try {
        doc.addImage(
          img.src,
          "JPEG",
          margins.left,
          yPosition,
          widthPt,
          heightPt
        );
        return yPosition + heightPt + 10; // 10 puntos de espacio adicional
      } catch (error) {
        console.error("Error al agregar imagen:", error);
        return yPosition;
      }
    };

    // Actualizar el procesamiento de preguntas y respuestas
    sortedQuestions.forEach(async (question, index) => {
      const questionText = processText(
        question.querySelector(".question-text").value
      );
      const questionNumber = index + 1;

      // Agregar pregunta al test
      yPosition = addWrappedText(
        `${questionNumber}. ${questionText}`,
        margins.left,
        yPosition,
        doc,
        12
      );

      // Agregar pregunta al documento de respuestas
      answerYPosition = addWrappedText(
        `${questionNumber}. ${questionText}`,
        margins.left,
        answerYPosition,
        answerDoc,
        12
      );

      // Agregar imagen si existe
      const imageContainer = question.querySelector(".image-container");
      yPosition = addImageToPDF(doc, imageContainer, yPosition);

      // Agregar opciones
      const options = question.querySelectorAll(".answer-option");
      options.forEach((option, optIndex) => {
        const optionText = option.querySelector('input[type="text"]').value;
        const isCorrect = option.querySelector(
          'input[type="radio"], input[type="checkbox"]'
        ).checked;
        const letter = String.fromCharCode(97 + optIndex);

        // Agregar opción al test con sangría
        yPosition = addWrappedText(
          `${letter}) ${optionText}`,
          margins.left + 10,
          yPosition,
          doc,
          10
        );

        // Agregar respuesta correcta al documento de respuestas
        if (isCorrect) {
          answerYPosition = addWrappedText(
            `    Respuesta correcta: ${letter}) ${optionText}`,
            margins.left,
            answerYPosition,
            answerDoc,
            10
          );
        }
      });

      yPosition += 5;
      answerYPosition += 5;
    });

    // Guardar documentos
    doc.save("test.pdf");
    answerDoc.save("respuestas.pdf");
  }

  printTest() {
    const { jsPDF } = window.jspdf;

    // Configurar el tamaño de página
    const pageConfig = {
      format: this.currentFormat.pageSize.toLowerCase(),
      orientation: "portrait",
    };

    const testDoc = new jsPDF(pageConfig);
    const answerDoc = new jsPDF(pageConfig);

    // Configurar la fuente
    testDoc.setFont(this.currentFormat.font);
    answerDoc.setFont(this.currentFormat.font);

    // Configuración de márgenes
    const margins = {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20,
    };

    const pageWidth = testDoc.internal.pageSize.width;
    const textWidth = pageWidth - margins.left - margins.right;

    // Función para manejar texto largo y saltos de página
    const addWrappedText = (text, x, y, pdfDoc, fontSize = 12) => {
      pdfDoc.setFontSize(fontSize);
      const lines = pdfDoc.splitTextToSize(text, textWidth);
      let currentY = y;

      lines.forEach((line) => {
        if (currentY > pdfDoc.internal.pageSize.height - margins.bottom) {
          pdfDoc.addPage();
          currentY = margins.top;
        }
        pdfDoc.text(line, x, currentY);
        currentY += fontSize * 0.5;
      });

      return currentY + fontSize * 0.3;
    };

    // Configuración común para ambos documentos
    const configureDocument = (pdfDoc, title) => {
      pdfDoc.setFont(this.currentFormat.font);
      pdfDoc.setFontSize(parseInt(this.currentFormat.titleSize));

      const titleWidth =
        (pdfDoc.getStringUnitWidth(title) *
          parseInt(this.currentFormat.titleSize)) /
        pdfDoc.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;

      pdfDoc.text(title, titleX, margins.top);
      return margins.top + parseInt(this.currentFormat.titleSize) * 0.5;
    };

    let yPosition = configureDocument(
      testDoc,
      document.getElementById("testTitle").value || "Test"
    );
    let answerYPosition = configureDocument(
      answerDoc,
      "Hoja de Respuestas Correctas"
    );

    // Agregar subtítulo y texto de apoyo
    const subtitle = document.getElementById("testSubtitle");
    if (
      !subtitle.parentElement.classList.contains("hidden") &&
      subtitle.value
    ) {
      testDoc.setFontSize(14);
      testDoc.text(subtitle.value, 20, yPosition);
      yPosition += 10;
    }

    const supportTextTitle = document.getElementById("supportTextTitle");
    const supportText = document.getElementById("supportText");
    if (!supportTextTitle.parentElement.classList.contains("hidden")) {
      if (supportTextTitle.value) {
        testDoc.setFontSize(12);
        testDoc.text(supportTextTitle.value, 20, yPosition);
        yPosition += 10;
      }
      if (supportText.value) {
        testDoc.setFontSize(10);
        const splitText = testDoc.splitTextToSize(supportText.value, 170);
        testDoc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 7;
      }
    }

    // Obtener todas las preguntas ordenadas por número
    const sortedQuestions = Array.from(
      document.querySelectorAll(".question-container")
    ).sort((a, b) => {
      const numA = parseInt(a.dataset.questionNumber);
      const numB = parseInt(b.dataset.questionNumber);
      return numA - numB;
    });

    // Procesar preguntas
    sortedQuestions.forEach((question, index) => {
      const questionText = question.querySelector(".question-text").value;
      const questionNumber = index + 1;

      // Agregar pregunta al test
      testDoc.setFontSize(12);
      testDoc.text(`${questionNumber}. ${questionText}`, 20, yPosition);
      yPosition += 10;

      // Agregar pregunta y respuestas correctas al documento de respuestas
      answerDoc.setFontSize(12);
      answerDoc.text(`${questionNumber}. ${questionText}`, 20, answerYPosition);
      answerYPosition += 7;

      // Agregar imagen si existe
      const imageContainer = question.querySelector(".image-container");
      yPosition = addImageToPDF(testDoc, imageContainer, yPosition);

      // Agregar opciones
      const options = question.querySelectorAll(".answer-option");
      options.forEach((option, optIndex) => {
        const optionText = option.querySelector('input[type="text"]').value;
        const isCorrect = option.querySelector(
          'input[type="radio"], input[type="checkbox"]'
        ).checked;
        const letter = String.fromCharCode(97 + optIndex);

        // Agregar opción al test
        testDoc.text(`${letter}) ${optionText}`, 30, yPosition);
        yPosition += 7;

        // Agregar respuesta correcta al documento de respuestas
        if (isCorrect) {
          answerDoc.setFontSize(10);
          answerDoc.text(
            `    Respuesta correcta: ${letter}) ${optionText}`,
            20,
            answerYPosition
          );
          answerYPosition += 7;
        }
      });

      yPosition += 5;
      answerYPosition += 5;

      // Nueva página si es necesario
      if (yPosition > 250) {
        testDoc.addPage();
        yPosition = 20;
      }
      if (answerYPosition > 250) {
        answerDoc.addPage();
        answerYPosition = 20;
      }
    });

    // Generar blobs de los PDFs
    const testBlob = new Blob([testDoc.output("blob")], {
      type: "application/pdf",
    });
    const answerBlob = new Blob([answerDoc.output("blob")], {
      type: "application/pdf",
    });

    // Crear URLs para los PDFs
    const testUrl = URL.createObjectURL(testBlob);
    const answerUrl = URL.createObjectURL(answerBlob);

    // Abrir PDFs en nuevas ventanas para imprimir
    const testWindow = window.open(testUrl);
    const answerWindow = window.open(answerUrl);

    // Imprimir automáticamente
    testWindow.onload = function () {
      testWindow.print();
    };
    answerWindow.onload = function () {
      answerWindow.print();
    };

    // Limpiar URLs después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(testUrl);
      URL.revokeObjectURL(answerUrl);
    }, 1000);
  }

  removeAnswerOption(button) {
    const answerOption = button.closest(".answer-option");
    const answersContainer = answerOption.parentElement;

    // Verificar que no sea la última opción
    if (answersContainer.children.length <= 1) {
      alert("Debe haber al menos una opción de respuesta");
      return;
    }

    // Si la opción a eliminar está marcada como correcta y es respuesta única,
    // marcar la primera opción restante como correcta
    const questionContainer = answersContainer.closest(".question-container");
    const questionType =
      questionContainer.querySelector(".question-type").value;
    const isChecked = answerOption.querySelector(
      'input[type="radio"], input[type="checkbox"]'
    ).checked;

    if (isChecked && questionType === "single") {
      const firstOption = answersContainer.querySelector(
        '.answer-option:not(:hover) input[type="radio"]'
      );
      if (firstOption) {
        firstOption.checked = true;
        const indicator = firstOption
          .closest(".answer-option")
          .querySelector(".correct-answer-indicator");
        indicator.style.display = "inline";
      }
    }

    // Eliminar la opción
    answerOption.remove();
  }
}

// Inicializar el creador de tests
const testCreator = new TestCreator();
