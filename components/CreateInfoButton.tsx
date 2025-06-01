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
      default:
        return "New Item";
    }
  };

  return (
    <FormButton
      mode="create"
      type={type as "employees" | "customers" | "services"}
    >
      {getTitle(type)}
    </FormButton>
  );
};

export default CreateInfoButton;
