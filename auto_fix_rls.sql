-- ============================================================================
-- AUTO-FIX RLS POLICIES - Handles missing columns automatically
-- ============================================================================
-- This script automatically detects which columns exist and applies
-- appropriate RLS policies based on available columns (clinic_id or user_id)
-- ============================================================================

-- ============================================================================
-- STEP 1: Helper function to get user's assigned clinic IDs
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_clinic_ids()
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uc.clinic_id
    FROM user_clinics uc
    WHERE uc.user_id = auth.uid()
    AND (uc.access_active = true OR uc.access_active IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_clinic_ids() TO authenticated, anon;

-- ============================================================================
-- STEP 2: Function to check if column exists
-- ============================================================================

CREATE OR REPLACE FUNCTION column_exists(p_table TEXT, p_column TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table AND column_name = p_column
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Apply RLS policies based on available columns
-- ============================================================================

-- Helper procedure to apply policy for a table
CREATE OR REPLACE PROCEDURE apply_rls_policy(
    p_table TEXT,
    p_use_user_id BOOLEAN DEFAULT false,
    p_use_clinic_id BOOLEAN DEFAULT false
)
LANGUAGE plpgsql AS $$
DECLARE
    v_policy_exists BOOLEAN;
BEGIN
    -- Enable RLS on table
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);
    
    -- Drop existing policies
    FOR v_policy_exists IN 
        SELECT EXISTS(
            SELECT 1 FROM pg_policies WHERE tablename = p_table
        )
    LOOP
        IF v_policy_exists THEN
            EXECUTE format('DROP POLICY IF EXISTS "rls_select" ON %I', p_table);
            EXECUTE format('DROP POLICY IF EXISTS "rls_insert" ON %I', p_table);
            EXECUTE format('DROP POLICY IF EXISTS "rls_update" ON %I', p_table);
            EXECUTE format('DROP POLICY IF EXISTS "rls_delete" ON %I', p_table);
        END IF;
    END LOOP;
    
    -- Apply policies based on available columns
    IF p_use_clinic_id THEN
        -- Use clinic_id for filtering
        EXECUTE format(
            'CREATE POLICY "rls_select" ON %I FOR SELECT 
             USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_insert" ON %I FOR INSERT 
             WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_update" ON %I FOR UPDATE 
             USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_delete" ON %I FOR DELETE 
             USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL)',
            p_table
        );
    ELSIF p_use_user_id THEN
        -- Use user_id for filtering
        EXECUTE format(
            'CREATE POLICY "rls_select" ON %I FOR SELECT 
             USING (user_id = auth.uid() OR user_id IS NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_insert" ON %I FOR INSERT 
             WITH CHECK (user_id = auth.uid())',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_update" ON %I FOR UPDATE 
             USING (user_id = auth.uid() OR user_id IS NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_delete" ON %I FOR DELETE 
             USING (user_id = auth.uid() OR user_id IS NULL)',
            p_table
        );
    ELSE
        -- No filtering - allow all (but require authentication)
        EXECUTE format(
            'CREATE POLICY "rls_select" ON %I FOR SELECT 
             USING (auth.uid() IS NOT NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_insert" ON %I FOR INSERT 
             WITH CHECK (auth.uid() IS NOT NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_update" ON %I FOR UPDATE 
             USING (auth.uid() IS NOT NULL)',
            p_table
        );
        EXECUTE format(
            'CREATE POLICY "rls_delete" ON %I FOR DELETE 
             USING (auth.uid() IS NOT NULL)',
            p_table
        );
    END IF;
END;
$$;

-- ============================================================================
-- STEP 4: Apply RLS to all data tables
-- ============================================================================

-- Clinics and related tables
DO $$
BEGIN
    -- Clinics
    IF column_exists('clinics', 'id') THEN
        ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS rls_select ON clinics;
        DROP POLICY IF EXISTS rls_insert ON clinics;
        DROP POLICY IF EXISTS rls_update ON clinics;
        DROP POLICY IF EXISTS rls_delete ON clinics;
        
        CREATE POLICY rls_select ON clinics FOR SELECT USING (id IN (SELECT get_user_clinic_ids()) OR id IS NULL);
        CREATE POLICY rls_insert ON clinics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        CREATE POLICY rls_update ON clinics FOR UPDATE USING (id IN (SELECT get_user_clinic_ids()));
        CREATE POLICY rls_delete ON clinics FOR DELETE USING (id IN (SELECT get_user_clinic_ids()));
    END IF;
    
    -- Clinic Branches
    IF column_exists('clinic_branches', 'clinic_id') THEN
        CALL apply_rls_policy('clinic_branches', false, true);
    END IF;
    
    -- User Clinics
    IF column_exists('user_clinics', 'user_id') THEN
        ALTER TABLE user_clinics ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS rls_select ON user_clinics;
        DROP POLICY IF EXISTS rls_insert ON user_clinics;
        DROP POLICY IF EXISTS rls_update ON user_clinics;
        DROP POLICY IF EXISTS rls_delete ON user_clinics;
        
        CREATE POLICY rls_select ON user_clinics FOR SELECT USING (user_id = auth.uid());
        CREATE POLICY rls_insert ON user_clinics FOR INSERT WITH CHECK (user_id = auth.uid());
        CREATE POLICY rls_update ON user_clinics FOR UPDATE USING (user_id = auth.uid());
        CREATE POLICY rls_delete ON user_clinics FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Patient data tables
DO $$
BEGIN
    -- Dentists
    IF column_exists('dentists', 'clinic_id') THEN
        CALL apply_rls_policy('dentists', false, true);
    ELSIF column_exists('dentists', 'user_id') THEN
        CALL apply_rls_policy('dentists', true, false);
    ELSE
        CALL apply_rls_policy('dentists', false, false);
    END IF;
    
    -- Patients
    IF column_exists('patients', 'clinic_id') THEN
        CALL apply_rls_policy('patients', false, true);
    ELSIF column_exists('patients', 'user_id') THEN
        CALL apply_rls_policy('patients', true, false);
    ELSE
        CALL apply_rls_policy('patients', false, false);
    END IF;
    
    -- Patient Attachments
    IF column_exists('patient_attachments', 'clinic_id') THEN
        CALL apply_rls_policy('patient_attachments', false, true);
    ELSIF column_exists('patient_attachments', 'user_id') THEN
        CALL apply_rls_policy('patient_attachments', true, false);
    ELSE
        CALL apply_rls_policy('patient_attachments', false, false);
    END IF;
    
    -- Appointments
    IF column_exists('appointments', 'clinic_id') THEN
        CALL apply_rls_policy('appointments', false, true);
    ELSIF column_exists('appointments', 'user_id') THEN
        CALL apply_rls_policy('appointments', true, false);
    ELSE
        CALL apply_rls_policy('appointments', false, false);
    END IF;
END $$;

-- Financial tables
DO $$
BEGIN
    -- Suppliers
    IF column_exists('suppliers', 'clinic_id') THEN
        CALL apply_rls_policy('suppliers', false, true);
    ELSIF column_exists('suppliers', 'user_id') THEN
        CALL apply_rls_policy('suppliers', true, false);
    ELSE
        CALL apply_rls_policy('suppliers', false, false);
    END IF;
    
    -- Supplier Invoices
    IF column_exists('supplier_invoices', 'clinic_id') THEN
        CALL apply_rls_policy('supplier_invoices', false, true);
    ELSIF column_exists('supplier_invoices', 'user_id') THEN
        CALL apply_rls_policy('supplier_invoices', true, false);
    ELSE
        CALL apply_rls_policy('supplier_invoices', false, false);
    END IF;
    
    -- Supplier Invoice Attachments
    IF column_exists('supplier_invoice_attachments', 'clinic_id') THEN
        CALL apply_rls_policy('supplier_invoice_attachments', false, true);
    ELSIF column_exists('supplier_invoice_attachments', 'user_id') THEN
        CALL apply_rls_policy('supplier_invoice_attachments', true, false);
    ELSE
        CALL apply_rls_policy('supplier_invoice_attachments', false, false);
    END IF;
    
    -- Inventory Items
    IF column_exists('inventory_items', 'clinic_id') THEN
        CALL apply_rls_policy('inventory_items', false, true);
    ELSIF column_exists('inventory_items', 'user_id') THEN
        CALL apply_rls_policy('inventory_items', true, false);
    ELSE
        CALL apply_rls_policy('inventory_items', false, false);
    END IF;
    
    -- Expenses
    IF column_exists('expenses', 'clinic_id') THEN
        CALL apply_rls_policy('expenses', false, true);
    ELSIF column_exists('expenses', 'user_id') THEN
        CALL apply_rls_policy('expenses', true, false);
    ELSE
        CALL apply_rls_policy('expenses', false, false);
    END IF;
END $$;

-- Treatment tables
DO $$
BEGIN
    -- Treatment Definitions
    IF column_exists('treatment_definitions', 'clinic_id') THEN
        CALL apply_rls_policy('treatment_definitions', false, true);
    ELSIF column_exists('treatment_definitions', 'user_id') THEN
        CALL apply_rls_policy('treatment_definitions', true, false);
    ELSE
        CALL apply_rls_policy('treatment_definitions', false, false);
    END IF;
    
    -- Treatment Doctor Percentages
    IF column_exists('treatment_doctor_percentages', 'clinic_id') THEN
        CALL apply_rls_policy('treatment_doctor_percentages', false, true);
    ELSIF column_exists('treatment_doctor_percentages', 'user_id') THEN
        CALL apply_rls_policy('treatment_doctor_percentages', true, false);
    ELSE
        CALL apply_rls_policy('treatment_doctor_percentages', false, false);
    END IF;
    
    -- Treatment Records
    IF column_exists('treatment_records', 'clinic_id') THEN
        CALL apply_rls_policy('treatment_records', false, true);
    ELSIF column_exists('treatment_records', 'user_id') THEN
        CALL apply_rls_policy('treatment_records', true, false);
    ELSE
        CALL apply_rls_policy('treatment_records', false, false);
    END IF;
END $$;

-- Payments tables
DO $$
BEGIN
    -- Payments
    IF column_exists('payments', 'clinic_id') THEN
        CALL apply_rls_policy('payments', false, true);
    ELSIF column_exists('payments', 'user_id') THEN
        CALL apply_rls_policy('payments', true, false);
    ELSE
        CALL apply_rls_policy('payments', false, false);
    END IF;
    
    -- Doctor Payments
    IF column_exists('doctor_payments', 'clinic_id') THEN
        CALL apply_rls_policy('doctor_payments', false, true);
    ELSIF column_exists('doctor_payments', 'user_id') THEN
        CALL apply_rls_policy('doctor_payments', true, false);
    ELSE
        CALL apply_rls_policy('doctor_payments', false, false);
    END IF;
END $$;

-- Insurance tables
DO $$
BEGIN
    -- Insurance Companies
    IF column_exists('insurance_companies', 'clinic_id') THEN
        CALL apply_rls_policy('insurance_companies', false, true);
    ELSIF column_exists('insurance_companies', 'user_id') THEN
        CALL apply_rls_policy('insurance_companies', true, false);
    ELSE
        CALL apply_rls_policy('insurance_companies', false, false);
    END IF;
    
    -- Insurance Accounts
    IF column_exists('insurance_accounts', 'clinic_id') THEN
        CALL apply_rls_policy('insurance_accounts', false, true);
    ELSIF column_exists('insurance_accounts', 'user_id') THEN
        CALL apply_rls_policy('insurance_accounts', true, false);
    ELSE
        CALL apply_rls_policy('insurance_accounts', false, false);
    END IF;
    
    -- Insurance Transactions
    IF column_exists('insurance_transactions', 'clinic_id') THEN
        CALL apply_rls_policy('insurance_transactions', false, true);
    ELSIF column_exists('insurance_transactions', 'user_id') THEN
        CALL apply_rls_policy('insurance_transactions', true, false);
    ELSE
        CALL apply_rls_policy('insurance_transactions', false, false);
    END IF;
    
    -- Patient Insurance Link
    IF column_exists('patient_insurance_link', 'clinic_id') THEN
        CALL apply_rls_policy('patient_insurance_link', false, true);
    ELSIF column_exists('patient_insurance_link', 'user_id') THEN
        CALL apply_rls_policy('patient_insurance_link', true, false);
    ELSE
        CALL apply_rls_policy('patient_insurance_link', false, false);
    END IF;
    
    -- Treatment Insurance Link
    IF column_exists('treatment_insurance_link', 'clinic_id') THEN
        CALL apply_rls_policy('treatment_insurance_link', false, true);
    ELSIF column_exists('treatment_insurance_link', 'user_id') THEN
        CALL apply_rls_policy('treatment_insurance_link', true, false);
    ELSE
        CALL apply_rls_policy('treatment_insurance_link', false, false);
    END IF;
END $$;

-- Other tables
DO $$
BEGIN
    -- Lab Cases
    IF column_exists('lab_cases', 'clinic_id') THEN
        CALL apply_rls_policy('lab_cases', false, true);
    ELSIF column_exists('lab_cases', 'user_id') THEN
        CALL apply_rls_policy('lab_cases', true, false);
    ELSE
        CALL apply_rls_policy('lab_cases', false, false);
    END IF;
    
    -- Prescriptions
    IF column_exists('prescriptions', 'clinic_id') THEN
        CALL apply_rls_policy('prescriptions', false, true);
    ELSIF column_exists('prescriptions', 'user_id') THEN
        CALL apply_rls_policy('prescriptions', true, false);
    ELSE
        CALL apply_rls_policy('prescriptions', false, false);
    END IF;
    
    -- Prescription Items
    IF column_exists('prescription_items', 'clinic_id') THEN
        CALL apply_rls_policy('prescription_items', false, true);
    ELSIF column_exists('prescription_items', 'user_id') THEN
        CALL apply_rls_policy('prescription_items', true, false);
    ELSE
        CALL apply_rls_policy('prescription_items', false, false);
    END IF;
    
    -- Employees
    IF column_exists('employees', 'clinic_id') THEN
        CALL apply_rls_policy('employees', false, true);
    ELSIF column_exists('employees', 'user_id') THEN
        CALL apply_rls_policy('employees', true, false);
    ELSE
        CALL apply_rls_policy('employees', false, false);
    END IF;
    
    -- Employee Attendance
    IF column_exists('employee_attendance', 'clinic_id') THEN
        CALL apply_rls_policy('employee_attendance', false, true);
    ELSIF column_exists('employee_attendance', 'user_id') THEN
        CALL apply_rls_policy('employee_attendance', true, false);
    ELSE
        CALL apply_rls_policy('employee_attendance', false, false);
    END IF;
    
    -- Employee Compensations
    IF column_exists('employee_compensations', 'clinic_id') THEN
        CALL apply_rls_policy('employee_compensations', false, true);
    ELSIF column_exists('employee_compensations', 'user_id') THEN
        CALL apply_rls_policy('employee_compensations', true, false);
    ELSE
        CALL apply_rls_policy('employee_compensations', false, false);
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Disable RLS on auth/user tables (managed by app)
-- ============================================================================

DO $$
BEGIN
    ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS user_permission_overrides DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
END $$;

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'RLS policies applied successfully based on available columns!' AS status;
