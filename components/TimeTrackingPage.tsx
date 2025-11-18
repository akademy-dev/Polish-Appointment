"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  CalendarIcon,
  Clock,
  DollarSign,
  User,
  Filter,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  createTimeTracking,
  updateTimeTracking,
  deleteTimeTracking,
  getTimeTrackingByDateRange,
  calculateTotalPay,
} from "@/actions/time-tracking";
import { Employee, TimeTracking } from "@/sanity/types";
import { client } from "@/sanity/lib/client";
import {
  ALL_EMPLOYEES_QUERY,
  TIME_TRACKING_QUERY,
  TIMEZONE_QUERY,
} from "@/sanity/lib/queries";

interface TimeTrackingPageProps {
  initialEmployees: Employee[];
  initialTimeTracking: TimeTracking[];
}

export default function TimeTrackingPage({
  initialEmployees,
  initialTimeTracking,
}: TimeTrackingPageProps) {
  console.log("TimeTrackingPage props:", {
    initialEmployees,
    initialTimeTracking,
    employeesLength: initialEmployees?.length,
    timeTrackingLength: initialTimeTracking?.length,
  });
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [timeTracking, setTimeTracking] =
    useState<TimeTracking[]>(initialTimeTracking);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [filterType, setFilterType] = useState<
    "all" | "date" | "employee" | "both"
  >("all");
  const [isLoading, setIsLoading] = useState(false);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<
    number | undefined
  >(undefined);

  // Check in/out form state
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    employeeId: "",
    note: "",
  });

  // Check out form state
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [selectedTimeTracking, setSelectedTimeTracking] =
    useState<TimeTracking | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Fetch settings to get default hourly rate
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingData = await client.fetch(TIMEZONE_QUERY);
        if (settingData?.hourlyRate) {
          setDefaultHourlyRate(settingData.hourlyRate);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch time tracking data
  const fetchTimeTracking = useCallback(async () => {
    try {
      const result = await client.fetch(TIME_TRACKING_QUERY);
      setTimeTracking(result);
    } catch (error) {
      console.error("Error fetching time tracking:", error);
      toast.error("Failed to fetch time tracking data");
    }
  }, []);

  // Filter time tracking based on selected criteria
  const filteredTimeTracking = useMemo(() => {
    if (!Array.isArray(timeTracking)) return [];
    let filtered = timeTracking;

    console.log("Filtering with:", {
      filterType,
      selectedEmployee,
      dateRange,
      timeTrackingLength: timeTracking.length,
      sampleRecord: timeTracking[0],
    });

    // Filter by employee
    if (
      (filterType === "employee" || filterType === "both") &&
      selectedEmployee
    ) {
      filtered = filtered.filter((record) => {
        const employee = record.employee;
        if (!employee) return false;

        // Check if employee is a reference object
        if ("_ref" in employee) {
          return employee._ref === selectedEmployee;
        }

        // Check if employee is a dereferenced object with _id
        if ("_id" in employee && typeof employee._id === "string") {
          return employee._id === selectedEmployee;
        }

        // Check if employee is a dereferenced object with firstName/lastName
        if (
          "firstName" in employee &&
          "lastName" in employee &&
          typeof employee.firstName === "string" &&
          typeof employee.lastName === "string"
        ) {
          const recordEmployeeName = `${employee.firstName} ${employee.lastName}`;
          return recordEmployeeName === selectedEmployeeName;
        }

        return false;
      });

      console.log("After employee filter:", {
        filteredLength: filtered.length,
        selectedEmployee,
        selectedEmployeeName,
        sampleFilteredRecord: filtered[0],
      });
    }

    // Filter by date range
    if (
      (filterType === "date" || filterType === "both") &&
      dateRange.from &&
      dateRange.to
    ) {
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();
      filtered = filtered.filter((record) => {
        const checkInDate = record.checkIn;
        return checkInDate && checkInDate >= fromDate && checkInDate <= toDate;
      });
    }

    return filtered;
  }, [timeTracking, filterType, selectedEmployee, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!Array.isArray(filteredTimeTracking))
      return { totalPay: 0, totalHours: 0 };
    const completedRecords = filteredTimeTracking.filter(
      (record) => record.status === "checked_out"
    );
    let totalPay = 0;
    let totalHours = 0;

    completedRecords.forEach((record) => {
      if (record.totalPay) {
        totalPay += record.totalPay;
      } else if (record.hourlyRate && record.totalHours) {
        totalPay += record.hourlyRate * record.totalHours;
      }

      if (record.totalHours) {
        totalHours += record.totalHours;
      }
    });

    return {
      totalPay: Math.round(totalPay * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
    };
  }, [filteredTimeTracking]);

  // Handle check in
  const handleCheckIn = async () => {
    if (!checkInForm.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createTimeTracking({
        employee: {
          _ref: checkInForm.employeeId,
          _type: "reference",
        },
        checkIn: new Date().toISOString(),
        hourlyRate: defaultHourlyRate || undefined,
        note: checkInForm.note || undefined,
      });

      if (result.status === "SUCCESS") {
        toast.success("Employee checked in successfully");
        setShowCheckInForm(false);
        setCheckInForm({
          employeeId: "",
          note: "",
        });
        fetchTimeTracking();
      } else {
        toast.error(result.error || "Failed to check in employee");
      }
    } catch (error) {
      toast.error("An error occurred while checking in");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check out
  const handleCheckOut = async () => {
    if (!selectedTimeTracking) return;

    setIsLoading(true);
    try {
      const result = await updateTimeTracking(selectedTimeTracking._id, {
        checkOut: new Date().toISOString(),
        status: "checked_out",
      });

      if (result.status === "SUCCESS") {
        toast.success("Employee checked out successfully");
        setShowCheckOutConfirm(false);
        setSelectedTimeTracking(null);
        fetchTimeTracking();
      } else {
        toast.error(result.error || "Failed to check out employee");
      }
    } catch (error) {
      toast.error("An error occurred while checking out");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete time tracking record
  const handleDelete = async (id: string) => {
    setRecordToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteTimeTracking(recordToDelete);
      if (result.status === "SUCCESS") {
        toast.success("Time tracking record deleted successfully");
        fetchTimeTracking();
      } else {
        toast.error(result.error || "Failed to delete time tracking record");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  // Format duration
  const formatDuration = (hours?: number) => {
    if (!hours) return "N/A";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="heading">Time Tracking</h2>
        <Button
          onClick={() => {
            setCheckInForm({
              employeeId: "",
              note: "",
            });
            setShowCheckInForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Check In Employee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(totals.totalHours)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totals.totalPay.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(timeTracking)
                ? timeTracking.filter(
                    (record) => record.status === "checked_in"
                  ).length
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Filter Type</Label>
              <Select
                value={filterType}
                onValueChange={(value: any) => setFilterType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="employee">By Employee</SelectItem>
                  <SelectItem value="date">By Date Range</SelectItem>
                  <SelectItem value="both">By Employee & Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterType === "employee" || filterType === "both") && (
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={(value) => {
                    setSelectedEmployee(value);
                    const employee = employees.find((emp) => emp._id === value);
                    setSelectedEmployeeName(
                      employee
                        ? `${employee.firstName} ${employee.lastName}`
                        : ""
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(filterType === "date" || filterType === "both") && (
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) =>
                        setDateRange({
                          from: range?.from,
                          to: range?.to || range?.from,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking Records */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTimeTracking.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time tracking records found
              </div>
            ) : (
              filteredTimeTracking.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">
                        {record.employee && "firstName" in record.employee
                          ? `${record.employee.firstName} ${record.employee.lastName}`
                          : "Unknown Employee"}
                      </h3>
                      <Badge
                        variant={
                          record.status === "checked_in"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {record.status === "checked_in"
                          ? "Checked In"
                          : "Checked Out"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Check In: {formatTime(record.checkIn || "")}</div>
                      {record.checkOut && (
                        <div>Check Out: {formatTime(record.checkOut)}</div>
                      )}
                      {record.totalHours && (
                        <div>Duration: {formatDuration(record.totalHours)}</div>
                      )}
                      {record.totalPay && (
                        <div>Total Pay: ${record.totalPay.toFixed(2)}</div>
                      )}
                      {record.note && <div>Note: {record.note}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {record.status === "checked_in" && (
                      <Button
                        onClick={() => {
                          setSelectedTimeTracking(record);
                          setShowCheckOutConfirm(true);
                        }}
                      >
                        Check Out
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(record._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check In Modal */}
      <Dialog open={showCheckInForm} onOpenChange={setShowCheckInForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={checkInForm.employeeId}
                onValueChange={(value) =>
                  setCheckInForm({ ...checkInForm, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Enter note"
                value={checkInForm.note}
                onChange={(e) =>
                  setCheckInForm({ ...checkInForm, note: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCheckInForm(false);
                  setCheckInForm({
                    employeeId: "",
                    note: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCheckIn} disabled={isLoading}>
                {isLoading ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Time Tracking Record"
        description="Are you sure you want to delete this time tracking record? This action cannot be undone."
        onConfirm={confirmDelete}
      />

      {/* Check Out Confirmation Dialog */}
      <ConfirmDialog
        open={showCheckOutConfirm}
        onOpenChange={setShowCheckOutConfirm}
        title="Check Out Employee"
        description={`Are you sure you want to check out this employee? This will end their current work session.`}
        onConfirm={handleCheckOut}
      />
    </div>
  );
}
