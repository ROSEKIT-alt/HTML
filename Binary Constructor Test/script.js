document.addEventListener("DOMContentLoaded", () => {
    const valueInput = document.getElementById("valueInput");
    const dataTypeSelect = document.getElementById("dataTypeSelect");
    const bigEndianRadio = document.getElementById("bigEndian");
    const littleEndianRadio = document.getElementById("littleEndian");
    const addDataBtn = document.getElementById("addDataBtn");
    const dataPointsList = document.getElementById("dataPointsList");
    const bufferSizeDisplay = document.getElementById("bufferSizeDisplay");
    const constructBinaryBtn = document.getElementById("constructBinaryBtn");
    const clearAllDataBtn = document.getElementById("clearAllDataBtn");
    const consoleOutput = document.getElementById("consoleOutput");
    const downloadBinaryBtn = document.getElementById("downloadBinaryBtn");

    let dataPoints = [];
    let currentConstructedBuffer = null;

    function updateConsole(message, type = 'info') {
       const p = document.createElement("p");
       p.className = type;
       p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
       consoleOutput.appendChild(p);
       consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function getByteSize(dataType) {
       switch(dataType) {
           case "Int8":
           case "Uint8": return 1;
           case "Int16":
           case "Uint16": return 2;
           case "Int32":
           case "Uint32":
           case "Float32": return 4;
           case "Float64": return 8;
           default: return 0;
       }
    }

    function renderDataPoints() {
       dataPointsList.innerHTML = "";
       if (dataPoints.length === 0) {
           dataPointsList.innerHTML = '<p class="placeholder-text">No data points added yet. Use the form above to add values.</p>';
           bufferSizeDisplay.textContent = "0 bytes";
           constructBinaryBtn.disabled = true;
           return;
       }

       let totalBytes = 0;
       dataPoints.forEach((point, index) => {
           const itemDiv = document.createElement("div");
           itemDiv.className = "data-list-item";

           const byteSize = getByteSize(point.type);
           totalBytes += byteSize;

           itemDiv.innerHTML = `
               <span><strong>${point.value}</strong> as ${point.type} (${byteSize} bytes, ${point.endian} Endian)</span>
               <button class="remove-btn" data-index="${index}" title="Remove this data point">×</button>
           `;
           dataPointsList.appendChild(itemDiv);
       });

       bufferSizeDisplay.textContent = `${totalBytes} bytes`;
       constructBinaryBtn.disabled = false;
    }

    addDataBtn.addEventListener("click", () => {
       const valueStr = valueInput.value.trim();
       const dataType = dataTypeSelect.value;
       const endianness = bigEndianRadio.checked ? "big" : "little";

       if (!valueStr) {
           updateConsole("Please enter a value.", "error");
           return;
       }

       let value;
       if (valueStr.startsWith("0x")) {
           value = parseInt(valueStr, 16);
       } else {
           value = parseFloat(valueStr);
       }

       if (isNaN(value)) {
           updateConsole(`Invalid numeric value: "${valueStr}". Please enter a valid number or hex string (e.g., 255, 3.14, 0xFF).`,  "error");
           return;
       }

       dataPoints.push({ value, type: dataType, endian: endianness });
       renderDataPoints();
       valueInput.value = "";
       updateConsole(`Added data point: ${value} as ${dataType} (${endianness} Endian).`);
    });

    dataPointsList.addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-btn")) {
            const index = parseInt(event.target.dataset.index);
            const removedPoint = dataPoints.splice(index, 1)[0];
            updateConsole(`Removed data point: ${removedPoint.value} as ${removedPoint.type}.`);
            renderDataPoints();
        }
    });

    constructBinaryBtn.addEventListener("click", () => {
        if (dataPoints.length === 0) {
            updateConsole("No data points to construct. Add some values first!", "error");
            return;
        }

        let totalBytes = 0;
        dataPoints.forEach(point => {
            totalBytes += getByteSize(point.type);
        });

        if (totalBytes === 0) {
            updateConsole("Calculated buffer size is 0. No data to write.", "error");
            return;
        }

        try {
            const buffer = new ArrayBuffer(totalBytes);
            const view = new DataView(buffer);
            let offset = 0;

            dataPoints.forEach(point => {
                const byteSize = getByteSize(point.type);
                const isLittleEndian = point.endian === "little";

                switch(point.type) {
                    case "Uint8":
                       if (point.value < 0 || point.value > 255) {
                           throw new Error(`Value ${point.value} out of range for Uint8 (0-255).`);
                       }
                       view.setUint8(offset, point.value);
                       break;
                    case "Int8":
                       if (point.value < -128 || point.value > 127) {
                           throw new Error(`Value ${point.value} out of range for Int8 (-128-127).`);
                       }
                       view.setInt8(offset, point.value);
                       break;
                    case "Uint16":
                       if (point.value < 0 || point.value > 65535) {
                           throw new Error(`Value ${point.value} out of range for Uint16 (0-65535).`);
                       }
                       view.setUint16(offset, point.value, isLittleEndian);
                       break;
                    case "Int16":
                       if (point.value < -32768 || point.value > 32768) {
                          throw new Error(`Value ${point.value} out of range for Int16 (-32768-32768).`);
                       }
                       view.setInt16(offset, point.value, isLittleEndian);
                       break;
                    case "Uint32":
                       if (point.value < 0 || point.value > 4294967295) {
                           throw new Error(`Value ${point.value} out of range for Uin32 (0-4294967295).`);
                       }
                       view.setUint32(offset, point.value, isLittleEndian);
                       break;
                    case "Int32":
                       if (point.value < -2147483648 || point.value > 2147483647) {
                           throw new Error(`Value ${point.value} out of range for Int32 (-2147483648-2147483647).`);
                       }
                       view.setInt32(offset, point.value, isLittleEndian);
                       break;
                    case "Float32":
                       view.setFloat32(offset, point.value, isLittleEndian);
                       break;
                    case "Float64":
                       view.setFloat64(offset, point.value, isLittleEndian);
                       break;
                    default:
                       throw new Error(`Unknown data type: ${point.type}`);
                }
                offset += byteSize;
            });

            currentConstructedBuffer = buffer;
            downloadBinaryBtn.disabled = false;
            updateConsole(`Successfully constructed binary buffer of ${totalBytes} bytes!`, "success");
            updateConsole(`Hex representation: ${Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join(' ')}`, "info");
        } catch(error) {
            updateConsole(`Error constructing binary: ${error.message}`, "error");
            currentConstructedBuffer = null;
            downloadBinaryBtn.disabled = true;
        }
    });

    clearAllDataBtn.addEventListener("click", () => {
        dataPoints = [];
        currentConstructedBuffer = null;
        renderDataPoints();
        downloadBinaryBtn.disabled = true;
        updateConsole("All data points cleared and constructed buffer reset.", "info");
    });

    downloadBinaryBtn.addEventListener("click", () => {
        if (!currentConstructedBuffer) {
            updateConsole("No binary data has been constructed yet to download.", "error");
            return;
        }

        try {
            const blob = new Blob([currentConstructedBuffer], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "BINARY.bin";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            updateConsole("Binary file 'BINARY.bin' downloaded successfully!", "success");
        } catch(error) {
            updateConsole(`Error during download: ${error.message}`, "error");
        }
    });

    renderDataPoints();
});