onload = function () {
  let fileInput = document.getElementById('file');
  fileInput.addEventListener('change', function (event) {
    var csvInput = event.target;
    var file = csvInput.files[0];
    Papa.parse(file, {
      header: true,
      complete: function (results) {
        console.log(results.data);
        fetchData(results.data);
      }
    });
  });
}
async function fetchData(data) {
  let file = document.getElementById("file").files[0];
  let formData = new FormData();
  formData.append("file", file);
  clearPage();
      let headers = [];
      for (let prop in data[0]) {
        headers.push(prop);
      }
      let headRow = document.createElement("tr");
      headers.forEach((element) => {
        const head = document.createElement("th");
        head.innerText = element;
        head.scope = "col";
        headRow.appendChild(head);
      });
      document.getElementById("headPlaceholder").appendChild(headRow);

      for (let row of data) {
        const tr = document.createElement("tr");
        for (let prop in row) {
          const cell = document.createElement("td");
          cell.innerText = row[prop];
          tr.appendChild(cell);
        }
        document.getElementById("bodyPlaceholder").appendChild(tr);
      }
      let pessimist = calculatePessimist(data);
      let optimist = calculateOptimist(data);
      let laplace = calculateLaplace(data);
      let hurwicz = calculateHurwicz(data);
      let savage = calculateSavage(data);

      document.getElementById(
        "optimistResult"
      ).innerText = `${optimist.function}(${optimist.value})`;
      document.getElementById(
        "pessimistResult"
      ).innerText = `${pessimist.function}(${pessimist.value})`;
      document.getElementById(
        "laplaceResult"
      ).innerText = `${laplace.function}(${laplace.value})`;
      document.getElementById(
        "savageResult"
      ).innerText = `${savage.function}(${savage.value})`;

      visualizeHurwicz(hurwicz);
  document.getElementById("invisibleContainer").classList.remove("invisible");
}
function visualizeHurwicz(data) {
  let tableResults = document.getElementById("hurwiczResults");

  let hth = document.createElement("th");
  hth.innerText = "h";
  document.getElementById("hurwiczHeader").appendChild(hth);

  for (let i = 0; i < data[0].values.length; i++) {
    let cell = document.createElement("td");
    cell.innerText = data[0].values[i].h;
    let row = tableResults.childNodes[i];
    if (!row) {
      row = document.createElement("tr");
      row.appendChild(cell);
      tableResults.appendChild(row);
    } else {
      row.appendChild(cell);
    }
  }
  for (let i = 0; i < data.length; i++) {
    let th = document.createElement("th");
    th.innerText = data[i].prop;
    document.getElementById("hurwiczHeader").appendChild(th);
    for (let j = 0; j < data[i].values.length; j++) {
      let cell = document.createElement("td");
      cell.innerText = data[i].values[j].value;
      let row = tableResults.childNodes[j];
      if (!row) {
        row = document.createElement("tr");
        row.appendChild(cell);
        tableResults.appendChild(row);
      } else {
        row.appendChild(cell);
      }
    }
  }
  prepareForGraph(data);
}

function prepareForGraph(rdata) {
  let xaxisArray = [];
  for (let i = 0; i < rdata[0].values.length; i++) {
    xaxisArray.push(rdata[0].values[i].h);
  }
  let seriesArray = [];
  for (let dataRow of rdata) {
    let series = {
      name: dataRow.prop,
      data: []
    }
    for (let i = 0; i < dataRow.values.length; i++) {
      series.data.push(dataRow.values[i].value);
    }

    seriesArray.push(series);
  }
  let options = {
    series: seriesArray,
    chart: {
      height: 600,
      type: 'line',
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Hurwicz data display',
      align: 'center'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        opacity: 0.5
      },
    },
    xaxis: {
      categories: xaxisArray,
      decimalsInFloat: 1,
      tickAmount: 'dataPoints',
      tickPlacement: "on",
      type: "numeric",
      title: {
        text: "H - Hope multiplier"
      },
      labels: {
        show: true
      },
      axisTicks: {
        show: true,
        borderType: 'solid',
        color: '#78909C',
        height: 6,
        offsetX: 0,
        offsetY: 0
      },
      crosshairs: {
        show: true,
      }
    }
  };
  document.getElementById("chart").innerHTML = "";

  let chart = new ApexCharts(document.getElementById("chart"), options);
  chart.render();
}

function calculatePessimist(data) {
  let rowSums = [];
  let minInd = -1;
  let minSum = Number.MAX_SAFE_INTEGER;
  let ri = 0;
  for (let row of data) {
    let rs = 0;
    for (var prop in row) {
      rs += Number.isNaN(Number(row[prop])) ? 0 : Number(row[prop]);
    }
    rowSums.push(rs);
    if (rs < minSum) {
      minSum = rs;
      minInd = ri;
    }
    ri++;
  }
  let max = -Infinity;
  let im = -1;
  let vm = null;
  for (let val in data[minInd]) {
    if (Number(data[minInd][val]) > max) {
      max = data[minInd][val];
      vm = val;
    }
  }
  return { function: vm, value: max };
}
function calculateOptimist(data) {
  let rowSums = [];
  let maxInd = -1;
  let maxSum = -Infinity;
  let ri = 0;
  for (let row of data) {
    let rs = 0;
    for (var prop in row) {
      rs += Number.isNaN(Number(row[prop])) ? 0 : Number(row[prop]);
    }
    rowSums.push(rs);
    if (rs > maxSum) {
      maxSum = rs;
      maxInd = ri;
    }
    ri++;
  }
  let max = -Infinity;
  let im = -1;
  let vm = null;
  for (let val in data[maxInd]) {
    if (Number(data[maxInd][val]) > max) {
      max = data[maxInd][val];
      vm = val;
    }
  }
  return { function: vm, value: max };
}
function calculateHurwicz(data) {
  let min = Infinity;
  let max = -Infinity;
  let results = [];
  for (let prop in data[0]) {
    if (Number.isNaN(Number(data[0][prop]))) {
      continue;
    }
    min = Infinity;
    max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (Number(data[i][prop]) > max) {
        max = Number(data[i][prop]);
      }
      if (Number(data[i][prop]) < min) {
        min = Number(data[i][prop]);
      }
    }
    let resultsProp = {
      prop: prop,
      values: [],
    };
    for (let h = 0; h <= 1; h += 0.1) {
      h = Math.round(h * 100) / 100;
      let res = Math.round((h * max + (1 - h) * min) * 100) / 100;
      resultsProp.values.push({
        h: h,
        value: res,
      });
    }
    results.push(resultsProp);
  }
  return results;
}
function calculateLaplace(data) {
  let maxSum = -Infinity;
  let maxInd = null;
  for (let prop in data[0]) {
    let colSum = 0;
    for (let i = 0; i < data.length; i++) {
      if (!Number.isNaN(Number(data[i][prop]))) {
        colSum += Number(data[i][prop]);
      }
    }
    const avg = Math.floor(colSum / data.length);
    if (avg > maxSum) {
      maxSum = avg;
      maxInd = prop;
    }
  }
  return { function: maxInd, value: maxSum };
}
function calculateSavage(data) {
  let maximums = [];
  let maximumIndexes = [];
  let maximum = -Infinity;
  for (let i = 0; i < data.length; i++) {
    max = -Infinity;
    let maxIndex = -1;
    for (let prop in data[i]) {
      if (!Number.isNaN(Number(data[i][prop])) && Number(data[i][prop]) > max) {
        max = Number(data[i][prop]);
        maxIndex = prop;
      }
    }
    maximums.push(max);
    maximumIndexes.push(maxIndex);
  }
  console.log(maximums);
  let differences = [];
  for (let i = 0; i < data.length; i++) {
    let rowDifferences = [];
    for (let prop in data[i]) {
      if (!Number.isNaN(Number(data[i][prop]))) {
        rowDifferences.push(maximums[i] - Number(data[i][prop]));
      }
    }
    differences.push(rowDifferences);
  }
  console.log(differences);
  let min = Infinity;
  let func = null;
  let indCol = -1;

  for (let i = 0; i < differences.length; i++) {
    let max = -Infinity;
    let tempIndCol = -1;
    for (let j = 0; j < differences.length; j++) {
      console.log(differences[j][i]);
      if (differences[j][i] > max) {
        max = differences[j][i];
        tempIndCol = i;
      }
    }
    if (max < min) {
      min = max;
      indCol = tempIndCol;
    }
  }
  let ctr = 0;
  func = null;
  for (let prop in data[0]) {
    if (ctr == indCol + 1) {
      func = prop;
      break;
    } else {
      ctr++;
    }
  }
  return { function: func, value: min };
}

function clearPage() { 
  document.getElementById("chart").innerHTML = "";
  document.getElementById("pessimistResult").innerHTML = "";
  document.getElementById("optimistResult").innerHTML = "";
  document.getElementById("laplaceResult").innerHTML = "";
  document.getElementById("savageResult").innerHTML = "";
  document.getElementById("hurwiczHeader").innerHTML = "";
  document.getElementById("hurwiczResults").innerHTML = "";
  document.getElementById("headPlaceholder").innerHTML = "";
  document.getElementById("bodyPlaceholder").innerHTML = "";
  document.getElementById("chart").innerHTML = "";
}
