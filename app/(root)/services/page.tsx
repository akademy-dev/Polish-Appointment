import React from "react";
import { ServiceDataTable } from "@/components/ServiceDataTable";

const page = async () => {
  // const categories = await client.fetch(SERVICE_QUERY);

  return (
    <>
      <h2 className="heading">Services</h2>
      <ServiceDataTable />
      {/*<div className="w-full overflow-hidden overflow-y-auto max-h-[calc(100vh-150px)] scrollbar-hide">*/}
      {/*  <Accordion type="multiple" className="w-md">*/}
      {/*    {categories.map((category: Category) => (*/}
      {/*      <AccordionItem value={category._id} key={category._id}>*/}
      {/*        <AccordionTrigger>{category.name}</AccordionTrigger>*/}
      {/*        <AccordionContent>*/}
      {/*          <ul>*/}
      {/*            {category.services.map((service: Service) => (*/}
      {/*              <li*/}
      {/*                key={service._id}*/}
      {/*                className="flex items-center justify-between gap-2"*/}
      {/*              >*/}
      {/*                <div className="flex items-center gap-2">*/}
      {/*                  <Circle*/}
      {/*                    color={service.showOnline ? "#28C840" : "#FF5F57"}*/}
      {/*                    size={12}*/}
      {/*                    fill={service.showOnline ? "#28C840" : "#FF5F57"}*/}
      {/*                  />*/}
      {/*                  {service.name}*/}
      {/*                </div>*/}
      {/*              </li>*/}
      {/*            ))}*/}
      {/*          </ul>*/}
      {/*        </AccordionContent>*/}
      {/*      </AccordionItem>*/}
      {/*    ))}*/}
      {/*  </Accordion>*/}
      {/*</div>*/}
    </>
  );
};

export default page;
