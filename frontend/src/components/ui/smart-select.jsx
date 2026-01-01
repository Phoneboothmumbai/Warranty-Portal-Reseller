import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * SmartSelect - A reusable searchable dropdown with async loading and inline creation
 * 
 * Props:
 * - value: Current selected value (id)
 * - onValueChange: Callback when value changes
 * - placeholder: Placeholder text
 * - searchPlaceholder: Placeholder for search input
 * - emptyText: Text when no results
 * - options: Array of {id, label, ...rest} or async fetch function
 * - fetchOptions: Async function (searchQuery) => Promise<options[]>
 * - displayKey: Key to use for display (default: 'label')
 * - valueKey: Key to use for value (default: 'id')
 * - allowCreate: Show "Add New" option
 * - onCreateNew: Callback when "Add New" clicked, receives (searchQuery)
 * - createLabel: Label for create button (default: 'Add New')
 * - renderCreateForm: Function that renders the create form
 * - disabled: Disable the select
 * - className: Additional classes for trigger
 * - debounceMs: Debounce delay for search (default: 300)
 */
const SmartSelect = React.forwardRef((
  {
    value,
    onValueChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    options: staticOptions,
    fetchOptions,
    displayKey = "label",
    valueKey = "id",
    allowCreate = false,
    onCreateNew,
    createLabel = "Add New",
    renderCreateForm,
    disabled = false,
    className,
    debounceMs = 300,
    ...props
  },
  ref
) => {
  const [open, setOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [options, setOptions] = React.useState(staticOptions || []);
  const [loading, setLoading] = React.useState(false);
  const debounceRef = React.useRef(null);

  // Update options when static options change
  React.useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  // Handle async search
  React.useEffect(() => {
    if (!fetchOptions) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchOptions(searchQuery);
        setOptions(results || []);
      } catch (error) {
        console.error("SmartSelect fetch error:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, fetchOptions, debounceMs]);

  // Initial fetch for async options
  React.useEffect(() => {
    if (fetchOptions && !staticOptions) {
      setLoading(true);
      fetchOptions("").then((results) => {
        setOptions(results || []);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [fetchOptions]);

  const selectedOption = options.find((opt) => opt[valueKey] === value);
  const displayValue = selectedOption ? selectedOption[displayKey] : placeholder;

  const handleSelect = (optionValue) => {
    onValueChange?.(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCreateClick = () => {
    if (renderCreateForm) {
      setCreateModalOpen(true);
      setOpen(false);
    } else if (onCreateNew) {
      onCreateNew(searchQuery);
      setOpen(false);
    }
  };

  const handleCreateSuccess = (newItem) => {
    // Add new item to options and select it
    if (newItem) {
      setOptions((prev) => [newItem, ...prev]);
      onValueChange?.(newItem[valueKey]);
    }
    setCreateModalOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
            {...props}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={!fetchOptions}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option[valueKey]}
                        value={option[displayKey]}
                        onSelect={() => handleSelect(option[valueKey])}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option[valueKey] ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{option[displayKey]}</span>
                        {option.subtitle && (
                          <span className="ml-2 text-xs text-muted-foreground truncate">
                            {option.subtitle}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {allowCreate && (onCreateNew || renderCreateForm) && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateClick}
                      className="cursor-pointer text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createLabel}
                      {searchQuery && (
                        <span className="ml-1 text-muted-foreground">
                          "{searchQuery}"
                        </span>
                      )}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Inline Create Modal */}
      {renderCreateForm && (
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
            </DialogHeader>
            {renderCreateForm({
              initialValue: searchQuery,
              onSuccess: handleCreateSuccess,
              onCancel: () => setCreateModalOpen(false),
            })}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

SmartSelect.displayName = "SmartSelect";

export { SmartSelect };
