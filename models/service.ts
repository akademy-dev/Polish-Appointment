export type Service = {
  _id: string;
  name: string;
  price: number;
  duration: number;
  showOnline: boolean;
  category: {
    _id: string;
    name: string;
  };
};

export const getServiceId = (service: Service): string => {
  return service._id;
};
