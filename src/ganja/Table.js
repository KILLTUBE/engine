export class Table {
    /**
     * 
     * @param {number} rows 
     * @param {number} cols 
     */
    constructor(rows, cols) {
        var table = document.createElement("table");
        this.rows = new Array(rows);
        for (var i=0; i<rows; i++) {
            var tr = document.createElement("tr");
            table.appendChild(tr);
            this.rows[i] = new Array(cols);
            for (var j=0; j<cols; j++) {
                var td = document.createElement("td");
                tr.appendChild(td);
                this.rows[i][j] = td;
            }
        }
        document.body.appendChild(table);
        this.dom = table;
    }

    /**
     * 
     * @param {number} row 
     * @param {number} col 
     * @param {string} value 
     */
    setText(row, col, value) {
        this.rows[row][col].innerText = value;
    }

    /**
     * 
     * @param {number} row 
     * @param {number} col 
     * @param {string} value 
     */
    setHTML(row, col, value) {
        this.rows[row][col].innerHTML = value;
    }
}
