forward
global type semantic_query_sample from nonvisualobject
end forward

prototypes
function string of_get_name()
subroutine of_run()
end prototypes

public function string of_get_name()
    return "demo"
end function

public subroutine of_run()
    string ls_name
    ls_name = of_get_name()
end subroutine