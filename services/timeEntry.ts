export interface TimeEntry {
  id: string;
  taskNumber: number;
  startDate: Date;
  endDate: Date;
  duration: number;
}

export function createTimeEntry(params: {
  id: string;
  taskNumber: number;
  startDate: Date;
  endDate: Date;
}): TimeEntry {
  const duration = params.endDate.getTime() - params.startDate.getTime();

  if (duration < 0) {
    throw new Error("endDate must be after startDate");
  }

  return {
    ...params,
    duration,
  };
}
