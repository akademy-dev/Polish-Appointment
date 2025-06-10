import FormButton from "./FormButton";

const CreateInfoButton = ({ type }: { type: string }) => {
  const getTitle = (type: string) => {
    switch (type) {
      case "employees":
        return "New Employee";
      case "customers":
        return "New Customer";
      case "services":
        return "New Service";
      case "schedule":
        return "New Appointment";
      default:
        return "New Item";
    }
  };

  return (
    <FormButton
      mode="create"
      type={type as "employees" | "customers" | "services" | "schedule"}
    >
      {getTitle(type)}
    </FormButton>
  );
};

export default CreateInfoButton;
