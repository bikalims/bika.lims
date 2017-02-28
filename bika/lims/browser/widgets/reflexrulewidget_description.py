# Writting the description for the widget
description = """
<p>
    When the results are introduced, some samples may need to be added to the next available worksheet in order to retest it and confirm the result or maybe the result of a previous analysis should be changed depending on the result of the reflexed analysis. These situations can be caused by the indetermination of the result or by a failed test.
</p>
<p>
    This functionality was designed to bring a high level of flexibility regarding to dynamic and automated creation of analyses, duplicates and other types of transitions without the need of user interaction.
</p>
<p>
    Basic idea:
</p>
<p>
    Each reflex rule have to be bound to an analysis method using the drop-down list. So, the actions defined inside that reflex rule will be triggered only if the analysis is submitted/verified using this method.
</p>
<p>
    Inside the reflex rule the user will be able to add actions for each analysis service belonging to the selected method. In order to improve the flexibility of the system the user can set some conditions over the analysis service. For instance, the user can restrict the trigger of the actions to only those analyses which a reflex rule has been applied to them (taking advantage of the method).
</p>
<p>
    An example of the usage could be: when a result "0" (e.g. Indeterminate) is submitted for an analysis "EID" using a method named "Method-X". Then the reflex-rule criteria is met and two duplicates will be generated and added into the next available worksheet assigned to the analyst specified. Later, if the analyst sets a result for those duplicates and any of the "second-level" conditions are met, the action "set result" will be triggered: a new analysis EID with result "0" (Indeterminate) will be added and set as the definitive result.
</p>
<p>
    How it works:
</p>

<ul>
    <li>
        Each Reflex Rule is bound to a method. The submitted analysis must has this method in order to trigger the Reflex Rule. In the first place the user has to choose from a drop-down list the method which the rules for the analysis service will be bind to. After  selecting the method, the system will display another list in order to choose the analysis service to add the rules when using the selected method.
    </li>
    <li>
        Each Reflex Rule can only contain one "top-level" rule. This rule will be activated each time a result is submitted for an analysis that matches with the rule's criteria. E.g. the result of an "EID" analysis equals to "0".
    </li>
    <li>
        Several "actions" can be triggered by this "top-level" rule. If the action implies the creation of another analysis (e.g. a "Duplicate"), a code next to the action will be displayed. This code may be used later in "second-level" rules as a _wildcard_ for referring to the analyses created dynamically. A given rule can "trigger" several actions at once (e.g. when the result of Analysis "EID" is "1", trigger two actions at once: "create duplicate (dup-1)" + "create duplicate (duplicate-2)". If the action involves the creation of a new analysis (e.g., Duplicate, Repeat), it displays a unique identifier (e.g. dup-1) next to the action.
    </li>
    <li>
        Each time a user press the "Add rule" button, a "secondary-rule" will be created. The secondary-rule box will be quite similar to the top-level rule box, but with the following differences:
        <ul>
            <li>
                The selection list for the field "The analysis is" will be populated with the identifiers of the analyses generated by the action(s) defined in the "top-level" (and "secondary-rules" if more than one).
            </li>
            <li>
                The conditions field can contain more than one condition linked with "and" or "or" logic operators.
            </li>
        </ul>
    </li>
    <li>
        The possible actions are "Repeat", "Duplicate" and "Set Result":
        <ul>
            <li>
                Repeat an analysis consist on cancel it and then create a new analysis with the same analysis service used for the canceled one (always working with the same sample). It'll do a retraction action.
            </li>
            <li>
                Duplicate an analysis consist on creating a new analysis with the same analysis service for the same sample. It is used in order to reduce the error procedure probability because both results must be similar.
            </li>
            <li>
                Setting the result instruction gives to the analysis a final result depending on the result obtained in the last analysis. It can work in two different ways, for example you can set the result of the original analysis (the first one) and this will change the result on the original one. If you select to create a new analysis, it will repeat the analysis and will set the defined result in it.
            </li>
        </ul>
    </li>
    <li>
        There is a selection list in each action section. This select has the following options and consequence.
        <ul>
            <li>
                1) "To the current worksheet" (selected by default)
            </li>
            <li>
                2) "To another worksheet"
            </li>
            <li>
                3) "Create another worksheet"
            </li>
            <li>
                4) "No worksheet"
            </li>
            <li>
                If option 1) is selected, the Analyst selection list will not be displayed. Since the action doesn't require to add the new analysis to another worksheet, the function will try to add the analysis to the same worksheet as the base analysis. If the base analysis is not assigned in a worksheet, no worksheet will be assigned to the new analysis.
            </li>
            <li>
                If option 2) is selected, the Analyst selection list will be displayed.
            </li>
            <li>
                If option 2) is selected and an analyst has also been selected, then the system will search for the latest worksheet in status "open" for the selected analyst and will add the analysis in that worksheet (the system also searches for the worksheet template if defined). If the system doesn't find any match, another worksheet assigned to the selected analyst and with the analysis must be automatically created.
            </li>
            <li>
                If option 2) is selected but no analyst selected, then the system will search for the latest worksheet in the status "open" regardless of the analyst assigned and will add the analysis in that worksheet. If there isn't any open worksheet available, then go to option 3)
            </li>
            <li>
                If option 3) is selected, a new worksheet with the defined analyst will be created. If no analyst is defined for the original analysis, the system will create a new worksheet and assign the same analyst as the original analysis to which the rule applies. If the original analysis doesn't have assigned any analyst, the system will assign the same analyst that was assigned to the latest worksheet available in the system. If there isn't any worksheet created yet, use the first active user with role "analyst" available.
            </li>
            <li>
                If option 4) the Analyst selection list will not be displayed. The analysis (duplicate, repeat, whatever) will be created, but not assigned to any worksheet, so it will stay "on queue", assigned to the same Analysis Request as the original analysis for which the rule has been triggered.
            </li>
        </ul>
    </li>
    <li>
        How to define methods in reflex rules
        <p>
            In some cases, the method involves more than one analysis (88, 60, etc.) at once so, all of them have to be grouped in some way: the best choice to group all the analyses that need to be performed in accordance with the statements of a given method is, obviously, a worksheet.
        </p>
        <p>
            Because the system expects a method to be assigned to each analysis individually, a method selection list will always be displayed next to each analysis from inside a worksheet, also if the worksheet was created keeping in mind a method like "Anylabs" (88 samples + 2QCs) or "Vironostika" (60 samples + 1 QC). So, in fact, the conceptual integrity of a worksheet could be broken easily:although a worksheet was meant to be addressed following the method "Anylabs" (with 88 samples/analyses, 2QC and all methods from the selections list set to "Anylabs" by default), the truth is that the analyst could change the method assigned to any of the analyses to e.g "Vironostika" before the submission of results.
        </p>
        <p>
            We have to be sure the integrity of the generated worksheets are not compromised. We address this by adding a Method selector in Worksheet Template's edit view. It works as follows: if a method is selected, it will be automatically set by default to all the analyses contained in a worksheet created using this Worksheet Template and the user/analyst will not be able to change them in the analysis anymore.
        </p>
        <p>
            There is a Worksheet Template selector in Reflex Rules to allow setting which Worksheet Template must be used in a duplicate (if the user selects to create the duplicate in a new worksheet). This could look like the following:
[Create a Duplicate  v]  [x] to other worksheet [x] by using the Worksheet Template [................ v]. Analyst: [analyst 1  v] ...  dup-2
        </p>
        <p>
            If this option is checked and there is no Worksheet open using this Worksheet Template with an empty slot available for this duplicate and selected analyst, a new Worksheet will be created by using the selected Worksheet Template and the duplicate will be added there. Otherwise, follow the traditional behavior (add the duplicate in the first open worksheet for the selected analyst. If there isn't any open worksheet for the selected analyst, create a new one from scratch and add the duplicate there).
        </p>
    </li>
</ul>
<p>
    Illustrative example:
</p>
<p>
--- Top-level rule ---
</p>
<p>
    If analysis is [EID  v]
</p>
<p>
    The result of the analysis is __0
</p>
<p>
    Apply actions below [on submit  v]
</p>
<p>
    1. [Create a Duplicate  v]  [x] to another worksheet. Analyst: [analyst 1  v] ... dup-1
</p>
<p>
    2. [Create a Duplicate  v]  [x] to another worksheet. Analyst: [analyst 1  v] ... dup-2
</p>
    -- Second-level rule --
</p>
<p>
    If analysis is [dup-1   v]
</p>
<p>
    The result of the analysis equals to [dup-2   v]  (and)
</p>
<p>
    The result of the analysis equals to __0
</p>
<p>
    Apply actions below [on submit   v]
</p>
<p>
    1. [Set Result    v] to analysis [EID   v]  as __0
</p>
</p>
    -- Second-level rule --
</p>
<p>
    If analysis is [dup-2   v]
</p>
<p>
    The result of the analysis equals to [dup-1   v]  (and)
</p>
<p>
    The result of the analysis equals to __0
</p>
<p>
    Apply actions below [on submit   v]
</p>
<p>
1. [Set Result    v] to analysis [EID   v]  as __0
</p>
<p>
In the example above, when a result "0" (e.g. Indeterminate) is submitted for an analysis "EID", the reflex-rule criteria will be met and two duplicates will be generated and added into the next available worksheet assigned to the analyst specified. Later, if the analyst sets a result for either dup-1 and dup-2 and any of the "second-level" conditions are met, the action "set result" will be triggered: a new analysis EID with result "0" (Indeterminate) will be added and set as the definitive result.
</p>
"""
