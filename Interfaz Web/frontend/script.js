let mutePreview = false
const sensorControllers = {
  lm35: { intervalId: null, chart: null, data: [], lastValue: null },
  amg8833: { intervalId: null, chart: null, data: [], lastValue: null },
  adxl345: { intervalId: null, chart: null, data: [], lastValue: null },
  outflow: { intervalId: null, chart: null, data: [], lastValue: null },
  fanrpm: { intervalId: null, chart: null, data: [], lastValue: null },
  acs712: { intervalId: null, chart: null, data: [], lastValue: null },
  fz0430: { intervalId: null, chart: null, data: [], lastValue: null }
}
let amg8833GridContainer = null
let amg8833Initialized = false

function hideAllDisplays() {
  document.getElementById('lm35Chart').style.display = 'none'
  document.getElementById('amg8833Chart').style.display = 'none'
  document.getElementById('adxl345Chart').style.display = 'none'
  document.getElementById('voltageChart').style.display = 'none'
  document.getElementById('amg8833Section').style.display = 'none'
  document.getElementById('fanrpmChart').style.display = 'none'
  document.getElementById('acs712Chart').style.display = 'none'
  document.getElementById('fz0430Chart').style.display = 'none'
}

function getFormattedTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

function formatToMinSecMs(rawLabel) {
  const parts = rawLabel.split(' ')
  if (parts.length < 2) return rawLabel
  const timePart = parts[1]
  const timeSplit = timePart.split(':')
  if (timeSplit.length < 3) return rawLabel
  const min = timeSplit[1]
  const secMs = timeSplit[2].split('.')
  const sec = secMs[0]
  const shortMs = secMs[1] ? secMs[1].substring(0,1) : '0'
  return `${min}:${sec}.${shortMs}`
}

function initializeSingleValueChart(canvasId, labelText, sensorName) {
  const ctx = document.getElementById(canvasId).getContext('2d')
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: labelText,
        data: [],
        borderWidth: 2,
        borderColor: '#007BFF',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        pointRadius: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#555' }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
            color: '#555',
            font: { size: 14 }
          },
          ticks: {
            color: '#555',
            callback: function (value) {
              const rawLabel = this.chart.data.labels[value] || ''
              return formatToMinSecMs(rawLabel)
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value',
            color: '#555',
            font: { size: 14 }
          },
          ticks: { color: '#555' }
        }
      }
    }
  })
}

function initializeADXL345Chart() {
  const ctx = document.getElementById('adxl345Chart').getContext('2d')
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Accel X (m/s²)', data: [], borderColor: '#FF0000', backgroundColor: 'rgba(255, 0, 0, 0.2)', pointRadius: 3, tension: 0.3 },
        { label: 'Accel Y (m/s²)', data: [], borderColor: '#00FF00', backgroundColor: 'rgba(0, 255, 0, 0.2)', pointRadius: 3, tension: 0.3 },
        { label: 'Accel Z (m/s²)', data: [], borderColor: '#0000FF', backgroundColor: 'rgba(0, 0, 255, 0.2)', pointRadius: 3, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#555', font: { size: 14 } }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
            color: '#555',
            font: { size: 14 }
          },
          ticks: {
            color: '#555',
            callback: function (value) {
              const rawLabel = this.chart.data.labels[value] || ''
              return formatToMinSecMs(rawLabel)
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Acceleration (m/s²)',
            color: '#555',
            font: { size: 14 }
          },
          ticks: { color: '#555' }
        }
      }
    }
  })
}

function initializeAMG8833() {
  const ctx = document.getElementById('amg8833Chart').getContext('2d')
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'AMG8833 Avg Temp (°C)',
        data: [],
        borderWidth: 2,
        borderColor: '#6F42C1',
        backgroundColor: 'rgba(111,66,193,0.1)',
        pointRadius: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#555' }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
            color: '#555',
            font: { size: 14 }
          },
          ticks: {
            color: '#555',
            callback: function (value) {
              const rawLabel = this.chart.data.labels[value] || ''
              return formatToMinSecMs(rawLabel)
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Temperature (°C)',
            color: '#555',
            font: { size: 14 }
          },
          ticks: { color: '#555' }
        }
      }
    }
  })
  amg8833GridContainer = document.getElementById('amg8833Grid')
  amg8833GridContainer.style.display = 'grid'
  amg8833GridContainer.style.gap = '0px'
  amg8833GridContainer.innerHTML = ''
  for (let i = 0; i < 64; i++) {
    const cell = document.createElement('div')
    cell.style.background = 'black'
    amg8833GridContainer.appendChild(cell)
  }
  amg8833Initialized = true
  return chart
}

async function sendDataToBackend(data) {
  try {
    const response = await fetch('http://localhost:3000/api/sensor-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error sending data:', errorData.error)
      return
    }
    const responseData = await response.json()
    console.log('Data stored:', responseData.id)
  } catch (error) {
    console.error('Network error:', error)
  }
}

function updateSingleValueChart(chart, value, sensorName) {
  const timestamp = getFormattedTimestamp()
  if (value !== null && value !== undefined) {
    chart.data.labels.push(timestamp)
    chart.data.datasets[0].data.push(value)
    sensorControllers[sensorName].lastValue = value
    updateMutePreviewList(sensorName, value)
    const dataObject = {
      timestamp: timestamp,
      sensor: sensorName,
      values: { value1: value }
    }
    sendDataToBackend(dataObject)
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift()
      chart.data.datasets[0].data.shift()
    }
    chart.update()
  }
}

function updateADXL345Chart(chart, data) {
  const timestamp = getFormattedTimestamp()
  if (data && data.x !== undefined && data.y !== undefined && data.z !== undefined) {
    chart.data.labels.push(timestamp)
    chart.data.datasets[0].data.push(data.x)
    chart.data.datasets[1].data.push(data.y)
    chart.data.datasets[2].data.push(data.z)
    sensorControllers.adxl345.lastValue = `x:${data.x}, y:${data.y}, z:${data.z}`
    updateMutePreviewList('adxl345', sensorControllers.adxl345.lastValue)
    const dataObject = {
      timestamp: timestamp,
      sensor: 'adxl345',
      values: { x: data.x, y: data.y, z: data.z }
    }
    sendDataToBackend(dataObject)
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift()
      chart.data.datasets.forEach(ds => ds.data.shift())
    }
    chart.update()
  }
}

function setThermalScale(min, max) {
  const thermalScale = document.querySelector('.thermal-scale')
  if (!thermalScale) return
  const spans = thermalScale.querySelectorAll('span')
  const scaleBar = thermalScale.querySelector('.scale-bar')
  if (spans.length !== 2 || !scaleBar) return
  spans[0].textContent = `${min.toFixed(1)}°C`
  spans[1].textContent = `${max.toFixed(1)}°C`
  scaleBar.style.background = `linear-gradient(to right, blue, red)`
}

function updateAMG8833(chart, data) {
  if (!data || !data.grid || data.grid.length !== 8 || data.grid[0].length !== 8) return
  let sum = 0
  let minTemp = Infinity
  let maxTemp = -Infinity
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const value = data.grid[row][col]
      sum += value
      if (value < minTemp) minTemp = value
      if (value > maxTemp) maxTemp = value
    }
  }
  const avg = sum / 64
  const timestamp = getFormattedTimestamp()
  chart.data.labels.push(timestamp)
  chart.data.datasets[0].data.push(avg)
  sensorControllers.amg8833.lastValue = `avg:${avg.toFixed(1)}`
  updateMutePreviewList('amg8833', sensorControllers.amg8833.lastValue)
  const dataObject = {
    timestamp: timestamp,
    sensor: 'amg8833',
    values: { avgTemp: avg, minTemp: minTemp, maxTemp: maxTemp, grid: data.grid }
  }
  sendDataToBackend(dataObject)
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift()
    chart.data.datasets[0].data.shift()
  }
  const currentMin = minTemp
  const currentMax = maxTemp
  setThermalScale(currentMin, currentMax)
  chart.options.scales.y.min = currentMin - 1
  chart.options.scales.y.max = currentMax + 1
  chart.update()
  const cells = amg8833GridContainer.children
  let index = 0
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      cells[index].style.background = getColorForValue(data.grid[row][col], currentMin, currentMax)
      index++
    }
  }
}

function getColorForValue(value, min, max) {
  const clampedValue = Math.max(min, Math.min(max, value))
  const ratio = (clampedValue - min) / (max - min)
  const gradientStops = [
    { ratio: 0.0, color: [0, 0, 255] },
    { ratio: 1.0, color: [255, 0, 0] }
  ]
  let lowerStop, upperStop
  for (let i = 0; i < gradientStops.length - 1; i++) {
    if (ratio >= gradientStops[i].ratio && ratio <= gradientStops[i + 1].ratio) {
      lowerStop = gradientStops[i]
      upperStop = gradientStops[i + 1]
      break
    }
  }
  if (!lowerStop || !upperStop) {
    lowerStop = gradientStops[0]
    upperStop = gradientStops[1]
  }
  const localRatio = (ratio - lowerStop.ratio) / (upperStop.ratio - lowerStop.ratio)
  const r = Math.round(lowerStop.color[0] + (upperStop.color[0] - lowerStop.color[0]) * localRatio)
  const g = Math.round(lowerStop.color[1] + (upperStop.color[1] - lowerStop.color[1]) * localRatio)
  const b = Math.round(lowerStop.color[2] + (upperStop.color[2] - lowerStop.color[2]) * localRatio)
  return `rgb(${r},${g},${b})`
}

async function fetchSensorData(ip, sensor) {
  const urlMap = {
    lm35: 'lm35',
    amg8833: 'amg8833',
    adxl345: 'adxl345',
    outflow: 'voltage',
    fanrpm: 'rpm',
    acs712: 'acs712',
    fz0430: 'fz0430'
  }
  const endpoint = urlMap[sensor]
  if (!endpoint) return null
  const url = `http://${ip}/${endpoint}`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching sensor data:', error)
    return null
  }
}

function startFetching() {
  const ip = document.getElementById('ip').value.trim()
  const fanIp = document.getElementById('fanIp').value.trim()
  const interval = parseInt(document.getElementById('interval').value, 10)
  if (!ip || !fanIp || isNaN(interval) || interval <= 0) {
    alert('Please enter valid IPs and interval.')
    return
  }
  stopFetching()
  hideAllDisplays()
  const checkboxes = document.querySelectorAll('.sensor-checkbox')
  const selectedSensors = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value)
  if (selectedSensors.length === 0) {
    alert('Please select at least one sensor.')
    return
  }
  selectedSensors.forEach(sensor => {
    if (sensor === 'lm35') {
      const c = document.getElementById('lm35Chart')
      c.style.display = 'block'
      if (sensorControllers.lm35.chart) {
        sensorControllers.lm35.chart.data.labels = []
        sensorControllers.lm35.chart.data.datasets[0].data = []
        sensorControllers.lm35.chart.update()
        sensorControllers.lm35.data = []
      } else {
        sensorControllers.lm35.chart = initializeSingleValueChart('lm35Chart', 'LM35 Temp (°C)', 'lm35')
      }
      sensorControllers.lm35.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'lm35')
        if (data && data.value !== undefined) {
          updateSingleValueChart(sensorControllers.lm35.chart, data.value, 'lm35')
        }
      }, interval)
    }
    if (sensor === 'outflow') {
      const c = document.getElementById('voltageChart')
      c.style.display = 'block'
      if (sensorControllers.outflow.chart) {
        sensorControllers.outflow.chart.data.labels = []
        sensorControllers.outflow.chart.data.datasets[0].data = []
        sensorControllers.outflow.chart.update()
        sensorControllers.outflow.data = []
      } else {
        sensorControllers.outflow.chart = initializeSingleValueChart('voltageChart', 'Outflow (V)', 'outflow')
      }
      sensorControllers.outflow.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'outflow')
        if (data && data.value !== undefined) {
          updateSingleValueChart(sensorControllers.outflow.chart, data.value, 'outflow')
        }
      }, interval)
    }
    if (sensor === 'fanrpm') {
      const c = document.getElementById('fanrpmChart')
      c.style.display = 'block'
      if (sensorControllers.fanrpm.chart) {
        sensorControllers.fanrpm.chart.data.labels = []
        sensorControllers.fanrpm.chart.data.datasets[0].data = []
        sensorControllers.fanrpm.chart.update()
        sensorControllers.fanrpm.data = []
      } else {
        sensorControllers.fanrpm.chart = initializeSingleValueChart('fanrpmChart', 'Fan RPM', 'fanrpm')
      }
      sensorControllers.fanrpm.intervalId = setInterval(async () => {
        const data = await fetchSensorData(fanIp, 'fanrpm')
        if (data && data.rpm !== undefined) {
          updateSingleValueChart(sensorControllers.fanrpm.chart, data.rpm, 'fanrpm')
        }
      }, interval)
    }
    if (sensor === 'acs712') {
      const c = document.getElementById('acs712Chart')
      c.style.display = 'block'
      if (sensorControllers.acs712.chart) {
        sensorControllers.acs712.chart.data.labels = []
        sensorControllers.acs712.chart.data.datasets[0].data = []
        sensorControllers.acs712.chart.update()
        sensorControllers.acs712.data = []
      } else {
        sensorControllers.acs712.chart = initializeSingleValueChart('acs712Chart', 'Current (A)', 'acs712')
      }
      sensorControllers.acs712.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'acs712')
        if (data && data.value !== undefined) {
          updateSingleValueChart(sensorControllers.acs712.chart, data.value, 'acs712')
        }
      }, interval)
    }
    if (sensor === 'fz0430') {
      const c = document.getElementById('fz0430Chart')
      c.style.display = 'block'
      if (sensorControllers.fz0430.chart) {
        sensorControllers.fz0430.chart.data.labels = []
        sensorControllers.fz0430.chart.data.datasets[0].data = []
        sensorControllers.fz0430.chart.update()
        sensorControllers.fz0430.data = []
      } else {
        sensorControllers.fz0430.chart = initializeSingleValueChart('fz0430Chart', 'Voltage (V)', 'fz0430')
      }
      sensorControllers.fz0430.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'fz0430')
        if (data && data.value !== undefined) {
          updateSingleValueChart(sensorControllers.fz0430.chart, data.value, 'fz0430')
        }
      }, interval)
    }
    if (sensor === 'adxl345') {
      const c = document.getElementById('adxl345Chart')
      c.style.display = 'block'
      if (sensorControllers.adxl345.chart) {
        sensorControllers.adxl345.chart.data.labels = []
        sensorControllers.adxl345.chart.data.datasets.forEach(ds => ds.data = [])
        sensorControllers.adxl345.chart.update()
        sensorControllers.adxl345.data = []
      } else {
        sensorControllers.adxl345.chart = initializeADXL345Chart()
      }
      sensorControllers.adxl345.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'adxl345')
        if (data) {
          updateADXL345Chart(sensorControllers.adxl345.chart, data)
        }
      }, interval)
    }
    if (sensor === 'amg8833') {
      const sec = document.getElementById('amg8833Section')
      const c = document.getElementById('amg8833Chart')
      sec.style.display = 'block'
      c.style.display = 'block'
      if (sensorControllers.amg8833.chart) {
        sensorControllers.amg8833.chart.data.labels = []
        sensorControllers.amg8833.chart.data.datasets[0].data = []
        sensorControllers.amg8833.chart.update()
        sensorControllers.amg8833.data = []
        const cells = amg8833GridContainer.children
        for (let i = 0; i < cells.length; i++) cells[i].style.background = 'black'
        const thermalScale = document.querySelector('.thermal-scale')
        if (thermalScale) {
          const spans = thermalScale.querySelectorAll('span')
          if (spans.length === 2) {
            spans[0].textContent = '20°C'
            spans[1].textContent = '40°C'
          }
        }
      } else {
        sensorControllers.amg8833.chart = initializeAMG8833()
      }
      sensorControllers.amg8833.intervalId = setInterval(async () => {
        const data = await fetchSensorData(ip, 'amg8833')
        if (data && data.grid) {
          updateAMG8833(sensorControllers.amg8833.chart, data)
        }
      }, interval)
    }
  })
}

function stopFetching() {
  hideAllDisplays()
  Object.keys(sensorControllers).forEach(sensor => {
    if (sensorControllers[sensor].intervalId) {
      clearInterval(sensorControllers[sensor].intervalId)
      sensorControllers[sensor].intervalId = null
    }
    if (sensorControllers[sensor].chart) {
      sensorControllers[sensor].chart.destroy()
      sensorControllers[sensor].chart = null
    }
    sensorControllers[sensor].data = []
  })
  if (amg8833GridContainer) amg8833GridContainer.innerHTML = ''
  amg8833Initialized = false
  hideAllDisplays()
}

document.addEventListener('DOMContentLoaded', () => {
  const fanSpeedSlider = document.getElementById('fanSpeed')
  const fanSpeedValue = document.getElementById('fanSpeedValue')
  fanSpeedValue.textContent = `${fanSpeedSlider.value}%`
  fanSpeedSlider.addEventListener('input', () => {
    fanSpeedValue.textContent = `${fanSpeedSlider.value}%`
  })
  fanSpeedSlider.addEventListener('change', () => {
    sendFanSpeed(fanSpeedSlider.value)
  })
})

async function sendFanSpeed(percentage) {
  const ipInput = document.getElementById('ip')
  const ip = ipInput.value.trim()
  const ipPattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
  if (!ipPattern.test(ip)) {
    alert('Please enter a valid IP address.')
    return
  }
  const pwmValue = Math.round((percentage / 100) * 255)
  const url = `http://${ip}/setPWM?value=${pwmValue}`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to set fan speed: ${response.status}`)
    console.log(`Fan speed set to ${percentage}% (PWM: ${pwmValue})`)
  } catch (error) {
    console.error('Error setting fan speed:', error)
    alert('Failed to set fan speed.')
  }
}

function toggleMutePreview() {
  mutePreview = !mutePreview
  if (mutePreview) {
    document.getElementById('chartsContainer').style.display = 'none'
    document.getElementById('mutePreviewContainer').style.display = 'block'
  } else {
    document.getElementById('chartsContainer').style.display = 'grid'
    document.getElementById('mutePreviewContainer').style.display = 'none'
  }
}

function updateMutePreviewList(sensor, value) {
  if (!mutePreview) return
  const list = document.getElementById('mutePreviewList')
  let item = document.getElementById(`${sensor}-mute`)
  if (!item) {
    item = document.createElement('li')
    item.id = `${sensor}-mute`
    list.appendChild(item)
  }
  item.textContent = `${sensor}: ${value}`
}
