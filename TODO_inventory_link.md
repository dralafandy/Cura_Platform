# TODO: Link Inventory Items to Supplier Invoices

## Plan:
1. [ ] Modify AddEditInvoiceModal to add inventory selection functionality
   - [ ] Add inventory items dropdown/selector
   - [ ] Auto-populate item details from inventory
   - [ ] Allow quantity input with auto-calculation
   - [ ] Show inventory icon for linked items
   
2. [ ] Add inventory update logic when saving invoice
   - [ ] Check for linked inventory items (inventoryItemId)
   - [ ] Update inventory stock (increase by quantity)
   - [ ] Show notification on inventory update

3. [ ] UI Improvements
   - [ ] Display current stock level when selecting items
   - [ ] Show visual indicator for inventory-linked items

## File to modify:
- components/finance/SuppliersManagement.tsx
