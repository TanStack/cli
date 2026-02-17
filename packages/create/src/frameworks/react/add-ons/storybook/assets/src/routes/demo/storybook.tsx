import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Dialog } from "#/components/storybook/dialog";
import { Input } from "#/components/storybook/input";
import { RadioGroup } from "#/components/storybook/radio-group";
import { Slider } from "#/components/storybook/slider";
import { Button } from "#/components/storybook/button";

export const Route = createFileRoute("/demo/storybook")({
  component: StorybookDemo,
});

function StorybookDemo() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [coffeeCups, setCoffeeCups] = useState(3);

  const handleSubmit = () => {};

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setEmploymentType("full-time");
    setCoffeeCups(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Dialog
          title="Employee Information Form"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="medium" onClick={handleReset}>
                Reset
              </Button>
              <Button
                variant="primary"
                size="medium"
                type="submit"
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="First Name"
              id="firstName"
              value={firstName}
              onChange={setFirstName}
              placeholder="John"
              required
            />

            <Input
              label="Last Name"
              id="lastName"
              value={lastName}
              onChange={setLastName}
              placeholder="Doe"
              required
            />

            <RadioGroup
              label="Employment Type"
              name="employmentType"
              options={[
                { value: "full-time", label: "Full Time" },
                { value: "part-time", label: "Part Time" },
              ]}
              value={employmentType}
              onChange={setEmploymentType}
            />

            <Slider
              label="Coffee Cups Per Day"
              id="coffeeCups"
              value={coffeeCups}
              onChange={setCoffeeCups}
              min={0}
              max={10}
            />
          </form>
        </Dialog>
      </div>
    </div>
  );
}
