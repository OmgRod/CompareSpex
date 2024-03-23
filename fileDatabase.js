// fileDatabase.js

const fs = require('fs');
const path = require('path');
const base64 = require('base-64');

class FileDatabase {
    constructor(basePath) {
        this.basePath = basePath;
        fs.mkdirSync(this.basePath, { recursive: true });
    }

    createTable(tableName, columns) {
        const tablePath = path.join(this.basePath, tableName);
        fs.mkdirSync(tablePath, { recursive: true });

        // Store table schema inside the table directory
        fs.writeFileSync(path.join(tablePath, 'schema.json'), JSON.stringify(columns));
    }

    insertRow(tableName, rowData) {
        const tablePath = path.join(this.basePath, tableName);

        const rowNumber = fs.readdirSync(tablePath).length + 1;
        const rowFolder = path.join(tablePath, `${rowNumber}.row`);
        fs.mkdirSync(rowFolder);

        // Ensure rowData is a string, if it's an array, convert it to a string
        if (Array.isArray(rowData)) {
            rowData = rowData.join(','); // Convert array elements to a string
        }

        // Encode and store row data
        const encodedData = base64.encode(rowData);
        fs.writeFileSync(path.join(rowFolder, 'row_content'), encodedData);
    }

    retrieveRows(tableName) {
        const tablePath = path.join(this.basePath, tableName);
        const rows = [];

        fs.readdirSync(tablePath).forEach((folder) => {
            const rowFolder = path.join(tablePath, folder);
            if (fs.statSync(rowFolder).isDirectory()) {
                const encodedData = fs.readFileSync(path.join(rowFolder, 'row_content'), 'utf8');
                const decodedData = base64.decode(encodedData);
                rows.push(decodedData);
            }
        });

        return rows;
    }

    deleteTable(tableName) {
        const tablePath = path.join(this.basePath, tableName);
        if (fs.existsSync(tablePath)) {
            fs.rmdirSync(tablePath, { recursive: true });
        } else {
            throw new Error(`Table '${tableName}' does not exist.`);
        }
    }

    deleteRow(tableName, rowNumber) {
        const rowFolder = path.join(this.basePath, tableName, `${rowNumber}.row`);
        if (fs.existsSync(rowFolder)) {
            fs.rmdirSync(rowFolder, { recursive: true });
        } else {
            throw new Error(`Row '${rowNumber}' in table '${tableName}' does not exist.`);
        }
    }

    deleteDatabase() {
        if (fs.existsSync(this.basePath)) {
            fs.rmdirSync(this.basePath, { recursive: true });
        } else {
            throw new Error('Database does not exist.');
        }
    }

    selectRows(tableName, conditionFunc) {
        const tablePath = path.join(this.basePath, tableName);
        const rows = [];

        fs.readdirSync(tablePath).forEach((folder) => {
            const rowFolder = path.join(tablePath, folder);
            if (fs.statSync(rowFolder).isDirectory()) {
                const encodedData = fs.readFileSync(path.join(rowFolder, 'row_content'), 'utf8');
                const decodedData = base64.decode(encodedData);
                if (conditionFunc(decodedData)) {
                    rows.push(decodedData);
                }
            }
        });
      

        return rows;
    }

  modifyRow(tableName, rowNumber, newData) {
      const tablePath = path.join(this.basePath, tableName);
      const rowFolder = path.join(tablePath, `${rowNumber}.row`);

      // Check if the row exists
      if (!fs.existsSync(rowFolder)) {
          throw new Error(`Row '${rowNumber}' in table '${tableName}' does not exist.`);
      }

      // Retrieve existing data
      const rowContentPath = path.join(rowFolder, 'row_content');
      const encodedData = fs.readFileSync(rowContentPath, 'utf8');
      const decodedData = base64.decode(encodedData);

      // Modify the data
      let modifiedData;
      if (typeof newData === 'function') {
          // If newData is a function, apply it to the existing data
          modifiedData = newData(decodedData);
      } else {
          // If newData is not a function, replace the existing data
          modifiedData = newData;
      }

      // Encode and store the modified data
      const encodedModifiedData = base64.encode(modifiedData);
      fs.writeFileSync(rowContentPath, encodedModifiedData);

      return modifiedData;
  }
}

module.exports = FileDatabase;