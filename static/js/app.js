let chart;
let allData = {
    beta: [],
    prod: []
};

let lastFilteredData = null;
let lastFilterParams = null;

const blockTypeSelect = document.getElementById("blockType");
const environmentSelect = document.getElementById("environment");

const cpsTypes = ['cps_p50', 'cps_p75', 'cps_p90', 'cps_p99', 'cps_p100'];
const cpsColors = ['#FFA500', '#FFCC00', '#FFEB3B', '#00BCD4', '#2196F3'];

async function fetchData(env) {
    const response = await fetch(`/api/data/${env}`);
    let data = await response.json();

    // Parse dates immediately after fetching the data
    for (const blockType in data) {
        data[blockType].forEach(row => {
            const rowDateParts = row.date.split(/[- :]/); // Split the date string into parts
            row.date = new Date(
                `20${rowDateParts[0]}`,
                parseInt(rowDateParts[1]) - 1,
                rowDateParts[2],
                rowDateParts[3],
                rowDateParts[4]
            );
        });
    }

    allData[env] = data;
}

function filterData(blockType, env, timeFilter) {
    if (lastFilterParams && lastFilterParams.blockType === blockType && 
        lastFilterParams.env === env && lastFilterParams.timeFilter === timeFilter) {
        // If the filter parameters haven't changed, return the previously filtered data
        return lastFilteredData;
    }

    const data = allData[env];
    let filteredData = data[blockType].filter(row => {        
        const rowDate = row.date; // Now we can use the parsed date directly

        if (timeFilter === "all") {
            return true; // Include all data
        } else if (timeFilter === "6months") {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return rowDate >= sixMonthsAgo; // Include data within the last 6 months
        } else if (timeFilter === "3months") {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return rowDate >= threeMonthsAgo; // Include data within the last 3 months
        } else if (timeFilter === "1month") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return rowDate >= oneMonthAgo; // Include data within the last 1 month
        }
    });

    lastFilteredData = filteredData;
    lastFilterParams = { blockType, env, timeFilter };

    return filteredData;
}

function getData(blockType, env, timeFilter) {
    const filteredData = filterData(blockType, env, timeFilter);

    return cpsTypes.map(cps => {
        return {
            label: cps,
            data: filteredData.map(row => ({ x: row.date, y: row[cps] })),
            borderColor: cpsColors[cpsTypes.indexOf(cps)],
            backgroundColor: cpsColors[cpsTypes.indexOf(cps)]
        };
    });
}

function drawChart() {
    const blockType = document.querySelector("#blockType .tab-option.selected").dataset.value;
    const env = document.querySelector("#environment .tab-option.selected").dataset.value;
    const timeFilter = document.querySelector("#timeFilter .tab-option.selected").dataset.value;
    
    const dataSets = getData(blockType, env, timeFilter);

    if (chart) {
        chart.destroy();
    }
    document.getElementById('spinner').style.display = 'none';

    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: dataSets
        },
        options: {
            animation: false,
            responsive: true,
            scales: {
                x: {
                    type: 'time', 
                    time: { parser: 'yyyy-MM-dd HH:mm', tooltipFormat: 'MMM d, yyyy HH:mm' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff' // change to whatever color you prefer
                        
                    },
                    onClick: function (event, legendItem) {
                        var ci = this.chart;
                        var index = legendItem.datasetIndex;
                    
                        // Toggle the visibility
                        ci.data.datasets[index].hidden = !ci.data.datasets[index].hidden;
                        if (ci.data.datasets[index].hidden) {
                            // When it's hidden, change the backgroundColor to black
                            ci.data.datasets[index].backgroundColor = 'black';
                        } else {
                            // When it's not hidden, change it back to the original color
                            ci.data.datasets[index].backgroundColor = cpsColors[cpsTypes.indexOf(legendItem.text)];
                        }
                    
                        // Update the chart
                        ci.update();
                        
                        // Update the table
                        updateTable(ci.data.datasets);
                    },
                    
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const lines = [];
                            
                            if (context.parsed.y !== null) {
                                lines.push(context.dataset.label);
                                lines.push(context.parsed.y.toFixed(2));
                            }
                            
                            return lines;
                        }
                    }
                }
            }
        },
    });

    return dataSets;  // return the dataSets for use elsewhere
}

blockTypeSelect.addEventListener('change', () => {
    const dataSets = drawChart(blockTypeSelect.value, environmentSelect.value);
    updateTable(dataSets);
});

environmentSelect.addEventListener('change', () => {
    const dataSets = drawChart(blockTypeSelect.value, environmentSelect.value);
    updateTable(dataSets);
});

document.querySelectorAll('.tab-selector').forEach(selector => {
    selector.addEventListener('click', event => {
        if (!event.target.classList.contains('tab-option')) return;

        // Remove .selected from all options in this selector
        selector.querySelectorAll('.tab-option').forEach(option => option.classList.remove('selected'));

        // Add .selected to the clicked option
        event.target.classList.add('selected');

        // Refresh the chart with the new selection
        const dataSets = drawChart();
        updateTable(dataSets);
    });
});

window.onload = function() {
    document.getElementById('spinner').style.display = 'block';
    const dataSets = drawChart();
    updateTable(dataSets);
}


function updateTable(dataSets) {
    const tableBody = document.querySelector("#last-data-points tbody");
    const tableHeader = document.querySelector("#last-data-points thead");

    // Clear the table body
    tableBody.innerHTML = '';

    // Clear the table header
    tableHeader.innerHTML = '';

    // Create new table header row
    const tr = document.createElement('tr');

    // Add static headers
    ['Date', 'Number of blocks'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        tr.appendChild(th);
    });

    // Add dynamic headers
    dataSets.filter(dataset => !dataset.hidden).forEach(dataset => {
        const th = document.createElement('th');
        th.textContent = dataset.label;
        tr.appendChild(th);
    });

    // Add the header row to the table
    tableHeader.appendChild(tr);

    // Take last 10 data points from each dataset and merge them into one array
    // Include the dataset label (CPS type) with each data point
    const lastDataPoints = dataSets.flatMap(ds => ds.data.slice(-10).map(dp => ({ ...dp, label: ds.label })));

    // Sort them by date
    lastDataPoints.sort((a, b) => b.x - a.x);

    // Group them by date
    const groupedByDate = {};
    lastDataPoints.forEach(dp => {
        const dateString = dp.x.toISOString();
        if (!groupedByDate[dateString]) {
            groupedByDate[dateString] = {};
        }
        groupedByDate[dateString][dp.label] = dp.y; // Use dp.label for the CPS type
    });

    // Insert each group as a table row
    for (const dateString in groupedByDate) {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = new Date(dateString).toLocaleDateString();
        tr.appendChild(tdDate);

        let totalBlockCount = 2500;

        const tdBlockCount = document.createElement('td');
        tdBlockCount.textContent = totalBlockCount;
        tr.appendChild(tdBlockCount);

        dataSets.filter(dataset => !dataset.hidden).forEach(dataset => {
            const tdCps = document.createElement('td');
            tdCps.textContent = (groupedByDate[dateString][dataset.label] || 0).toFixed(1); // show one decimal
            tdCps.style.color = cpsColors[cpsTypes.indexOf(dataset.label)]; // assign the same color as chart
            tr.appendChild(tdCps);
        });

        tableBody.appendChild(tr);
    }

    // Calculate averages
    let avgCpsValues = {};
    cpsTypes.forEach(cps => {
        const sum = Object.values(groupedByDate).reduce((acc, row) => acc + (row[cps] || 0), 0);
        const avg = sum / Object.keys(groupedByDate).length;
        avgCpsValues[cps] = avg;
    });

    // Append row with averages
    const avgRow = document.createElement('tr');

    const tdAvg = document.createElement('td');
    tdAvg.textContent = 'Average';
    avgRow.appendChild(tdAvg);

    const tdAvgBlockCount = document.createElement('td');
    tdAvgBlockCount.textContent = '';  // There's no average for block count
    avgRow.appendChild(tdAvgBlockCount);

    dataSets.filter(dataset => !dataset.hidden).forEach(dataset => {
        const tdAvgCps = document.createElement('td');
        tdAvgCps.textContent = avgCpsValues[dataset.label].toFixed(1);
        tdAvgCps.style.color = cpsColors[cpsTypes.indexOf(dataset.label)];  // Apply color
        avgRow.appendChild(tdAvgCps);
    });

    tableBody.appendChild(avgRow);
}




Promise.all([fetchData('beta'), fetchData('prod')]).then(() => {
    const dataSets = drawChart();
    updateTable(dataSets);
});

blockTypeSelect.addEventListener('change', () => {
    const dataSets = drawChart(blockTypeSelect.value, environmentSelect.value);
    updateTable(dataSets);
});

environmentSelect.addEventListener('change', () => {
    const dataSets = drawChart(blockTypeSelect.value, environmentSelect.value);
    updateTable(dataSets);
});

document.querySelectorAll('.tab-selector').forEach(selector => {
    selector.addEventListener('click', event => {
        if (!event.target.classList.contains('tab-option')) return;

        // Remove .selected from all options in this selector
        selector.querySelectorAll('.tab-option').forEach(option => option.classList.remove('selected'));

        // Add .selected to the clicked option
        event.target.classList.add('selected');

        // Refresh the chart with the new selection
        const dataSets = drawChart();
        updateTable(dataSets);
    });
});

window.onload = function() {
    document.getElementById('spinner').style.display = 'block';
    // const dataSets = drawChart();
    // updateTable(dataSets);
}
