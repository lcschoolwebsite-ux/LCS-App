import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function useActiveAcademicYear(fallbackYear = "Academic Year") {
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);

  useEffect(() => {
    api.get("/academic-years/active")
      .then(({ data }) => setActiveAcademicYear(data || null))
      .catch(() => setActiveAcademicYear(null));
  }, []);

  const academicYearLabel = useMemo(
    () => activeAcademicYear?.year || fallbackYear || "Academic Year",
    [activeAcademicYear?.year, fallbackYear]
  );

  return { activeAcademicYear, academicYearLabel };
}
