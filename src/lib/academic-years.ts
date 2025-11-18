/**
 * Generates academic years in the pattern: 2024, 2024-2025, 2025, 2025-2026, etc.
 * Alternates between single year and year range up to 2063
 */
export const generateAcademicYears = (): string[] => {
  const years: string[] = [];
  const startYear = 2024;
  const endYear = 2063;
  
  for (let year = startYear; year <= endYear; year++) {
    // Add single year
    years.push(year.toString());
    
    // Add year range (e.g., 2024-2025) if not at the end
    if (year < endYear) {
      years.push(`${year}-${year + 1}`);
    }
  }
  
  return years;
};

/**
 * Gets the current academic year based on the date
 * Returns single year format (e.g., "2024")
 */
export const getCurrentAcademicYear = (): string => {
  return new Date().getFullYear().toString();
};
