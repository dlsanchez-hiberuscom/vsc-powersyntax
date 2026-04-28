forward
global type w_main from window
end type
end forward

global type w_main from window
integer ii_instance
end type

public function integer of_setdata (readonly string as_val, integer ai_id);
integer li_local = 1
string ls_text
ls_text = as_val
return li_local
end function

event clicked;
long ll_count
ll_count = 1
end event
