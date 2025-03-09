// Process data based on time range
export function processDataByTimeRange(data: any[], startTime: number, endTime: number) {
    return data.filter(
      (item) =>
        (item.start_time >= startTime && item.start_time <= endTime) ||
        (item.end_time >= startTime && item.end_time <= endTime) ||
        (item.start_time <= startTime && item.end_time >= endTime),
    )
  }
  
  // Calculate cumulative data for all timestamps before the current range
  export function calculateCumulativeData(data: any[], beforeTime: number) {
    return data.filter((item) => item.end_time < beforeTime)
  }
  
  // Get average sentiment for a dataset
  export function getAverageSentiment(data: any[]) {
    if (data.length === 0) return 0
    return data.reduce((sum, item) => sum + item.normalized_score, 0) / data.length
  }
  
  // Get speaker distribution
  export function getSpeakerDistribution(data: any[]) {
    const speakerMap = new Map()
  
    data.forEach((item) => {
      const speaker = item.speaker
      const duration = item.end_time - item.start_time
  
      if (speakerMap.has(speaker)) {
        speakerMap.set(speaker, speakerMap.get(speaker) + duration)
      } else {
        speakerMap.set(speaker, duration)
      }
    })
  
    return Array.from(speakerMap.entries()).map(([name, value]) => ({
      name,
      value,
    }))
  }
  
  // Get compliance distribution
  export function getComplianceDistribution(data: any[]) {
    const complianceData = [
      { name: "Compliant", value: 0 },
      { name: "Non-Compliant", value: 0 },
      { name: "Unknown", value: 0 },
    ]
  
    data.forEach((item) => {
      if (item.compliance_flag === true) {
        complianceData[0].value += 1
      } else if (item.compliance_flag === false) {
        complianceData[1].value += 1
      } else {
        complianceData[2].value += 1
      }
    })
  
    return complianceData
  }
  
  // Get insurance context distribution
  export function getInsuranceContextDistribution(data: any[]) {
    const contextData = [
      { name: "Insurance Related", value: 0 },
      { name: "Not Insurance Related", value: 0 },
    ]
  
    data.forEach((item) => {
      if (item.is_insurance_context === true) {
        contextData[0].value += 1
      } else if (item.is_insurance_context === false) {
        contextData[1].value += 1
      }
    })
  
    return contextData
  }
  
  