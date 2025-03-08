"use client";
import { create } from "zustand";

const defaultValues = {
  isOpen: false,
};

interface SliderState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const useSliderToggler = create<SliderState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },
  expanded: (() => {
    const storedOpen = localStorage.getItem("sidebarOpen");
    return storedOpen ? JSON.parse(storedOpen) : false;
  })(),
  setExpanded: (expanded: boolean) => {
    localStorage.setItem("sidebarOpen", JSON.stringify(expanded));
    set({ expanded });
  },
}));

export default useSliderToggler;
