const fs = require('fs');
const path = require('path');
const base64 = require('base-64');

class FileDatabase {
    constructor(databaseName, basePath) {
        this.databaseName = databaseName;
        this.basePath = basePath;
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

  createTable(tableName, columns) {
      const tablePath = this.getTablePath(tableName);
      const schemaPath = path.join(tablePath, 'schema.json');
      if (fs.existsSync(tablePath)) {
          throw new Error(`Table '${tableName}' already exists in database '${this.databaseName}'.`);
      } else {
          fs.mkdirSync(tablePath, { recursive: true });
          fs.writeFileSync(schemaPath, JSON.stringify(columns));
      }
  }

    addColumn(tableName, columnName) {
        const tablePath = this.getTablePath(tableName);
        const schemaPath = path.join(tablePath, 'schema.json');
        if (fs.existsSync(tablePath)) {
            const schema = this.getTableSchema(tableName);
            if (!schema.includes(columnName)) {
                schema.push(columnName);
                fs.writeFileSync(schemaPath, JSON.stringify(schema));
                // Modify existing rows to add the new column (add a comma)
                this.modifyRowsInTable(tableName, rowData => {
                    rowData += ',';
                    return rowData;
                });
            }
        } else {
            throw new Error(`Table '${tableName}' does not exist in database '${this.databaseName}'.`);
        }
    }

    removeColumn(tableName, columnName) {
        const tablePath = this.getTablePath(tableName);
        const schemaPath = path.join(tablePath, 'schema.json');
        if (fs.existsSync(tablePath)) {
            const schema = this.getTableSchema(tableName);
            const columnIndex = schema.indexOf(columnName);
            if (columnIndex !== -1) {
                schema.splice(columnIndex, 1);
                fs.writeFileSync(schemaPath, JSON.stringify(schema));
                // Modify existing rows to remove data for the removed column
                this.modifyRowsInTable(tableName, rowData => {
                    const rowValues = rowData.split(',');
                    rowValues.splice(columnIndex, 1);
                    return rowValues.join(',');
                });
            }
        } else {
            throw new Error(`Table '${tableName}' does not exist in database '${this.databaseName}'.`);
        }
    }

    insertRow(tableName, rowData) {
        const tablePath = this.getTablePath(tableName);
        const rowNumber = this.getNextRowNumber(tableName);
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
        const tablePath = this.getTablePath(tableName);
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
        const tablePath = this.getTablePath(tableName);
        if (fs.existsSync(tablePath)) {
            fs.rmdirSync(tablePath, { recursive: true });
        } else {
            throw new Error(`Table '${tableName}' does not exist in database '${this.databaseName}'.`);
        }
    }

    deleteRow(tableName, rowNumber) {
        const rowFolder = path.join(this.getTablePath(tableName), `${rowNumber}.row`);
        if (fs.existsSync(rowFolder)) {
            fs.rmdirSync(rowFolder, { recursive: true });
        } else {
            throw new Error(`Row '${rowNumber}' in table '${tableName}' does not exist in database '${this.databaseName}'.`);
        }
    }

    deleteDatabase() {
        const databasePath = path.join(this.basePath, this.databaseName);
        if (fs.existsSync(databasePath)) {
            fs.rmdirSync(databasePath, { recursive: true });
        } else {
            throw new Error(`Database '${this.databaseName}' does not exist.`);
        }
    }

    selectRows(tableName, conditionFunc) {
        const tablePath = this.getTablePath(tableName);
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
        const rowFolder = path.join(this.getTablePath(tableName), `${rowNumber}.row`);
        if (fs.existsSync(rowFolder)) {
            const rowContentPath = path.join(rowFolder, 'row_content');
            const encodedData = fs.readFileSync(rowContentPath, 'utf8');
            const decodedData = base64.decode(encodedData);
            let modifiedData;
            if (typeof newData === 'function') {
                modifiedData = newData(decodedData);
            } else {
                modifiedData = newData;
            }
            const encodedModifiedData = base64.encode(modifiedData);
            fs.writeFileSync(rowContentPath, encodedModifiedData);
            return modifiedData;
        } else {
            throw new Error(`Row '${rowNumber}' in table '${tableName}' does not exist in database '${this.databaseName}'.`);
        }
    }

    getTablePath(tableName) {
        return path.join(this.basePath, this.databaseName, tableName);
    }

    getTableSchema(tableName) {
        const schemaPath = path.join(this.getTablePath(tableName), 'schema.json');
        return JSON.parse(fs.readFileSync(schemaPath));
    }

    getNextRowNumber(tableName) {
        const tablePath = this.getTablePath(tableName);
        return fs.readdirSync(tablePath).length + 1;
    }

    modifyRowsInTable(tableName, modifyFunc) {
        const tablePath = this.getTablePath(tableName);
        fs.readdirSync(tablePath).forEach((folder) => {
            const rowFolder = path.join(tablePath, folder);
            if (fs.statSync(rowFolder).isDirectory()) {
                const rowContentPath = path.join(rowFolder, 'row_content');
                let rowData = fs.readFileSync(rowContentPath, 'utf8');
                const modifiedData = modifyFunc(rowData);
                fs.writeFileSync(rowContentPath, modifiedData);
            }
        });
    }
  tableExists(tableName) {
      const tablePath = this.getTablePath(tableName);
      return fs.existsSync(tablePath);
  }
}

module.exports = FileDatabase;