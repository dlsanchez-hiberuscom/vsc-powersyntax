forward
global type w_main from window
end type
end forward

global type w_main from window
private integer ii_used_var
private string is_unused_var
integer ii_public_var
end type

type variables
string is_type_var
end variables

public function integer of_setdata (readonly string as_val, integer ai_id);
integer li_local = 1
string ls_unused_local
string ls_used_local
ls_used_local = as_val
ii_used_var = ai_id
return li_local
end function

event clicked;
long ll_count
ll_count = 1
of_setdata("test", ll_count)
end event

event open;
string ls_bad
ls_bad = of_nonexistent_function()
this.of_also_missing()
long ll_good
ll_good = ii_used_var
end event
