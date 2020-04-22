# Redmine Extended - chrome plugin
Chrome extension that provides some additional features to redmine

Can be switched on and off in popup of this extension.

* Fordable list of subtassks
* Converting decimal time to hh:mm form for estimation and remaining time of subtickets (Convert Time ON/OFF)
* Change font size based on how many levels subticket has (Change Font On/OFF)
* Search for subtickets (Search ON/OFF)
* API integration (Use API ON/OFF):
  * Remaining time (based on estimation and % of done)
  * Estimation time for subtasks
  * Parents path for subtasks (visible on hover or in Ex. Menu if turned on)
* Check length of description (Check Description ON/OFF):
  * Will work only if Use API is ON
  * Tickets that got no description will be marked with red color
  * Tickets that got description shorter than minimum characters length (separate input) will be marked with dark yellow color
* Extend Roadmap info (Extend Roadmap info ON/OFF):
  * Will work only if Use API is ON
  * Append additional info:
    * Done percentage
    * Remaining time
    * Assignee
* Allow to collapse/expand Roadmap parts (Collapsible Roadmap ON/OFF)
* Replace ID of issue with its title in WIKI content (Swap Issue Info ON/OFF)
* New actions available for selected subticket (Ex. Menu ON/OFF):
  * View - view issue in popup without redirect
  * Edit - same edit functionality, but will redirect to previous page after save
  * Add here - create new ticket as subticket for current one
  * Filter - create a filter for subtickets of current one
