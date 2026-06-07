"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { FilmBrandLogo } from "@/components/customer/FilmBrandLogo";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EmptyFallback = {
  value: string;
  label: string;
  helperText: string;
  onSelect?: (searchQuery: string) => void;
};

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: boolean;
  onBlur?: () => void;
  getOptionLogo?: (option: string) => string | undefined;
  emptyFallback?: EmptyFallback;
};

function SelectOptionLabel({
  label,
  logoSrc
}: {
  label: string;
  logoSrc?: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {logoSrc ? <FilmBrandLogo src={logoSrc} alt="" size={24} /> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

function matchesSearch(option: string, searchQuery: string) {
  return option.toLowerCase().includes(searchQuery.trim().toLowerCase());
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyMessage = "No results.",
  disabled = false,
  error = false,
  onBlur,
  getOptionLogo,
  emptyFallback
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedLogo = value && getOptionLogo ? getOptionLogo(value) : undefined;
  const usesManualFilter = Boolean(emptyFallback);

  const { visibleOptions, showEmptyFallback } = useMemo(() => {
    if (!usesManualFilter || !emptyFallback) {
      return { visibleOptions: [...options], showEmptyFallback: false };
    }

    const trimmedSearch = searchQuery.trim();
    const fallbackValue = emptyFallback.value;
    const searchableOptions = options.filter((option) => option !== fallbackValue);

    if (!trimmedSearch) {
      return { visibleOptions: [...options], showEmptyFallback: false };
    }

    const matched = searchableOptions.filter((option) => matchesSearch(option, trimmedSearch));
    if (matched.length > 0) {
      return { visibleOptions: matched, showEmptyFallback: false };
    }

    return { visibleOptions: [], showEmptyFallback: true };
  }, [emptyFallback, options, searchQuery, usesManualFilter]);

  const closePopover = () => {
    setOpen(false);
    setSearchQuery("");
  };

  const selectFallback = () => {
    const query = searchQuery.trim();
    if (emptyFallback?.onSelect) {
      emptyFallback.onSelect(query);
    } else {
      onValueChange(emptyFallback?.value ?? "Other");
    }
    closePopover();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearchQuery("");
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-border/80 bg-card px-3 font-normal shadow-sm transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-accent/30 hover:bg-accent/[0.04]",
            !value && "text-muted-foreground",
            open && "border-accent/40 bg-accent/[0.06]",
            error && "border-destructive/60 focus-visible:ring-destructive/25"
          )}
        >
          {value ? (
            getOptionLogo ? (
              <SelectOptionLabel label={value} logoSrc={selectedLogo} />
            ) : (
              <span className="truncate">{value}</span>
            )
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={!usesManualFilter}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={usesManualFilter ? searchQuery : undefined}
            onValueChange={usesManualFilter ? setSearchQuery : undefined}
          />
          <CommandList>
            {showEmptyFallback && emptyFallback ? (
              <CommandGroup>
                <CommandItem value={emptyFallback.value} onSelect={selectFallback}>
                  <Check className="mr-2 h-4 w-4 shrink-0 opacity-0" />
                  <span className="flex min-w-0 flex-col gap-1 py-0.5">
                    <SelectOptionLabel
                      label={emptyFallback.label}
                      logoSrc={getOptionLogo?.(emptyFallback.value)}
                    />
                    <span className="pl-[34px] text-xs leading-relaxed text-muted-foreground">
                      {emptyFallback.helperText}
                    </span>
                  </span>
                </CommandItem>
              </CommandGroup>
            ) : null}

            {!showEmptyFallback && visibleOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : null}

            {!showEmptyFallback ? (
              <CommandGroup>
                {visibleOptions.map((option) => {
                  const logoSrc = getOptionLogo?.(option);
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => {
                        onValueChange(option);
                        closePopover();
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4 shrink-0", value === option ? "opacity-100" : "opacity-0")}
                      />
                      {getOptionLogo ? (
                        <SelectOptionLabel label={option} logoSrc={logoSrc} />
                      ) : (
                        option
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
