<?php
/**
 * priority matrix structure
 *
 */
?>


<?php
global $post;
$args = array(
	'post_type' => 'todo',
	'posts_per_page' => -1
	);

$todos = new WP_Query($args);

//echo '<pre>';
//print_r($todos);
//echo '</pre>';

?>
<div class="row">
	<div class="col-sm-12">
		<div class="console-errors-wrap">
			<div id="errorconsole"></div>
		</div>
	</div>
</div>
<div id="controls-wrap" class="clearfix">
	<div class="row">
		<div class="col-sm-12">


			<ul id="matrix-tabs" class="nav nav-tabs" role="tablist">
				<li role="presentation" class="active"><a class="tab-control" href="#pm-form-new-todo-panel" aria-controls="new todo" role="tab" data-toggle="tab">New Todo</a></li>
				<li role="presentation"><a class="tab-control" href="#pm-form-edit-todo-panel" aria-controls="edit todo" role="tab" data-toggle="tab">Edit Todo</a></li>
			</ul>

			<div class="tab-content">
				<div role="tabpanel" class="tab-pane active" id="pm-form-new-todo-panel">
					<form id="todo-new" class="form-inline">
						<div class="form-group">
							<input type="text" class="form-control" id="new-todo-title" placeholder="Type a new task here">
						</div>
						<select class="form-control" id="new-todo-label" name="new-todo-label">
							<option class="pm-label" value="unlabeled">Label</option>
							<option class="pm-red" value="red">red</option>
							<option class="pm-orange" value="orange">orange</option>
							<option class="pm-green" value="green">green</option>
						</select>
						<button type="submit" id="new_pm_submit" name="new_pm_submit" class="btn btn-success">Save</button>
					</form>
				</div>
				<div role="tabpanel" class="tab-pane" id="pm-form-edit-todo-panel">
					<form id="todo-edit" class="form-inline">
						<div class="form-group">
							<input type="text" class="form-control" id="edit-todo-title" placeholder="Click a todo card below to edit">
						</div>
						<select class="form-control" id="todo-label" name="todo-label">
							<option class="pm-label" value="unlabeled">Label</option>
							<option class="pm-red" value="red">red</option>
							<option class="pm-orange" value="orange">orange</option>
							<option class="pm-green" value="green">green</option>
						</select>
						<input type="hidden" id="post_id" name="post_id">
						<button type="submit" id="pm_submit" name="pm_submit" class="btn btn-success">Update</button>
					</form>
				</div>
			</div>





		</div>
	</div>
</div>
<div id="matrix-container" data-userid="<?php echo get_current_user_id(); ?>" class="clearfix">
	<div id="urgent-important" class="upper-left grid-one grid-quad dropzone">
		<div class="zone-status"></div>
		<div class="pm-gridlabel-do-state quad-label">Do Now</div>
		<div class="pm-gridlabel-vertical quad-label"><div class="pm-rotate">Important</div></div>
	</div>
	<div id="not-urgent-important" class="upper-right grid-two grid-quad dropzone">
		<div class="zone-status"></div>
		<div class="pm-gridlabel-do-state quad-label">Do Later</div>
	</div>
	<div id="urgent-not-important" class="lower-left grid-three grid-quad dropzone">
		<div class="zone-status"></div>
		<div class="pm-gridlabel-vertical quad-label"><div class="pm-rotate">Less Important</div></div>
	</div>
	<div id="not-urgent-not-important" class="lower-right grid-four grid-quad dropzone">
		<div class="zone-status"></div>
	</div>
	<div id="todo-done-area" class="dropzone done-area">
		<div class="zone-status"></div>
		<div class="pm-gridlabel-vertical quad-label"><div class="pm-rotate">Done</div></div>
	</div>
	<div id="todo-set">
		<?php

		if ($todos->have_posts()){
			while ( $todos->have_posts() ) : $todos->the_post();
						$x_pos = get_post_meta($post->ID,'x_pos',true);// store as % for now 0.00-100.00
						$y_pos = get_post_meta($post->ID,'y_pos',true);
						$pm_label = get_post_meta($post->ID,'pm_label',true);
						$pm_quadrant = get_post_meta($post->ID,'pm_quadrant',true);
						if( !$x_pos ){
							$x_pos = 0.1;
						}

						if( !$y_pos ){
							$y_pos = 0.1;
						}
						if( !$pm_label){
							$pm_label = 'unlabeled';
						}
						?>

						<div id="drag-<?php echo $post->ID; ?>" class="draggable drag-todo js-drag pm-activity dropzone yes-drop" data-postid="<?php echo $post->ID; ?>" data-xpos="<?php echo $x_pos; ?>" data-ypos="<?php echo $y_pos; ?>" data-x="" data-y="" style="transform: translate(0px, 0px);">
							<div class="pm-todo-label <?php echo $pm_label; ?>" data-label="<?php echo $pm_label; ?>"><?php //echo $pm_label; ?></div>
							<div class="inner-border">
								<div class="todo-title"><?php the_title(); ?></div>
								<!-- div class="todo-content"><?php //the_content(); ?></div -->
							</div>
							<div class="update-border"></div>
							<div class="status-border"></div>
						</div>
					<?php endwhile;
				} ?>
			</div>
		</div>




		<script>
			var ajax_url = '<?php echo admin_url("admin-ajax.php?action=pm_update_position"); ?>';
		</script>


		<?php
