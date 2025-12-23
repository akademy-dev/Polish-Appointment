import { notFound } from "next/navigation";
import { getEmployeeById } from "@/data/employee";
import { getAllServices } from "@/data/service";
import EmployeeDetailClient from "./EmployeeDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

const EmployeeDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  // Handle new employee creation
  if (id === "new") {
    const services = await getAllServices();
    return <EmployeeDetailClient employee={null} allServices={services} />;
  }

  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const services = await getAllServices();

  return <EmployeeDetailClient employee={employee} allServices={services} />;
};

export default EmployeeDetailPage;
