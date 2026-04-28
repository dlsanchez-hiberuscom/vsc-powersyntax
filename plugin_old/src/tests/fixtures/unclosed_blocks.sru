// Fixture with unclosed blocks for diagnostic testing
event open;
    integer li_value
    if li_value > 0 then
        for li_value = 1 to 10
            li_value = li_value + 1

    // Missing: next (unclosed FOR)
    // Missing: end if (unclosed IF)
end event
