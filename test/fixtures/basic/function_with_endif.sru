forward
global type w_test from window
end type
end forward

global type w_test from window
end type

public function integer of_compute (integer ai_value);
integer li_local
li_local = ai_value
if ai_value > 0 then
	li_local = ai_value * 2
else
	li_local = 0
end if
integer li_after_endif
li_after_endif = li_local + 1
return li_after_endif
end function

event clicked;
long ll_a, ll_b, ll_c
ll_a = 1
ll_b = 2
ll_c = ll_a + ll_b
end event
