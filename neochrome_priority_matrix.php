<?php 
/**
 * @package Neochrome_Priority_Matrix
 * @version 0.8 beta
 */
/*
Plugin Name: Neochrome Priority Matrix
Plugin URI: http://neochro.me
Description: A Matrix, for Priorities
Author: Matthew Taylor
Version: 1.6
Author URI: http://neochro.me
*/




if (!function_exists('write_log')) {
	function write_log ( $log )  {
		if ( true === WP_DEBUG ) {
			if ( is_array( $log ) || is_object( $log ) ) {
				error_log( print_r( $log, true ) );
			} else {
				error_log( $log );
			}
		}
	}
}










function ncpm_scripts() {
	wp_register_style( 'ncpm.css', plugin_dir_url( __FILE__ ) . 'resources/custom.css', array() );
	wp_enqueue_style( 'ncpm.css');

	wp_enqueue_style( 'google-fonts-npm','https://fonts.googleapis.com/css?family=Roboto:300',array() );

	wp_enqueue_style( 'bootstrap-css','https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',array(),'3.3.7' );

	wp_enqueue_script( 'bootstrap-js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', array('jquery'), '20170628', true );

	wp_enqueue_script( 'interact-js', '//cdnjs.cloudflare.com/ajax/libs/interact.js/1.2.8/interact.min.js', array(), '20170628', true );

	wp_enqueue_script( 'ncpm-main', plugin_dir_url( __FILE__ ) . 'resources/main.js', array('jquery','interact-js'), '20170723', true );

	wp_enqueue_script( 'interact-js', '//cdnjs.cloudflare.com/ajax/libs/interact.js/1.2.8/interact.min.js', array(), '20170628', true );

}
add_action( 'wp_enqueue_scripts', 'ncpm_scripts' );





add_action( 'init', 'todo_items_cpt' );

function todo_items_cpt() {
	$labels = array(
		'name'               => _x( 'Todos', 'post type general name', '_s' ),
		'singular_name'      => _x( 'Todo', 'post type singular name', '_s' ),
		'menu_name'          => _x( 'Todos', 'admin menu', '_s' ),
		'name_admin_bar'     => _x( 'Todo', 'add new on admin bar', '_s' ),
		'add_new'            => _x( 'Add New', 'Todo', '_s' ),
		'add_new_item'       => __( 'Add New Todo', '_s' ),
		'new_item'           => __( 'New Todo', '_s' ),
		'edit_item'          => __( 'Edit Todo', '_s' ),
		'view_item'          => __( 'View Todo', '_s' ),
		'all_items'          => __( 'All Todos', '_s' ),
		'search_items'       => __( 'Search Todos', '_s' ),
		'parent_item_colon'  => __( 'Parent Todos:', '_s' ),
		'not_found'          => __( 'No todos found.', '_s' ),
		'not_found_in_trash' => __( 'No todos found in Trash.', '_s' )
		);

	$args = array(
		'labels'             => $labels,
		'description'        => __( 'Description.', '_s' ),
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'todo' ),
		'capability_type'    => 'post',
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'author', 'thumbnail','custom-fields' )
		);

	register_post_type( 'todo', $args );
}









function ncprioritymatrix_func( $atts ){
	include plugin_dir_path( __FILE__ ).'/resources/matrix-template.php';
}
add_shortcode( 'ncprioritymatrix', 'ncprioritymatrix_func' );







add_action( 'wp_ajax_pm_update_todo', 'pm_update_todo' );
add_action( 'wp_ajax_nopriv_pm_update_todo', 'pm_update_todo' );

function pm_update_todo() {
	write_log('pm_update_todo');
	$user_id = $_REQUEST['user_id'];
	$post_id = $_REQUEST['post_id'];
	$title = $_REQUEST['title'];
	$pmFilter = $_REQUEST['pm_filter'];
	$response = 'failed';
	$logged_in_id = get_current_user_id();
	if ($user_id == $logged_in_id){
		$post_args = array(
			'ID' => $post_id,
			'post_type' => 'todo',
			'post_title' => $title,
			);
		$update_post = wp_update_post($post_args);
		if ($update_post){
			update_post_meta($post_id,'pm_filter',$pmFilter );
			$response = 'postUpdated';
		} else {
			write_log('update todo failed');
			$response = 'UpdateFailed';
		}
	} else {
		$response = 'badId';
	}
	$reply = new WP_Ajax_Response;
	$reply->add( array(
		'data' => 'recieved',
		'supplemental' => array(
			'status' => $response,
			'newId' => $update_post
			)
		));
	$reply->send();
	exit();
}



add_action( 'wp_ajax_pm_set_as_draft', 'pm_set_as_draft' );
add_action( 'wp_ajax_nopriv_pm_set_as_draft', 'pm_set_as_draft' );

function pm_set_as_draft() {
	write_log('pm_set_as_draft');
	$user_id = $_REQUEST['user_id'];
	$post_id = $_REQUEST['post_id'];
	$response = 'failed';
	$logged_in_id = get_current_user_id();
	if ($user_id == $logged_in_id){
		$post_args = array(
			'ID' => $post_id,
			'post_status' => 'draft',
			);
		$update_post = wp_update_post($post_args);
		if ($update_post){
			$response = 'setAsDraft';
		} else {
			$response = 'failed';
		}

	} else {
		$response = 'badId';
	}
	$reply = new WP_Ajax_Response;
	$reply->add( array(
		'data' => 'recieved',
		'supplemental' => array(
			'status' => $response,
			'newId' => $update_post
			)
		));
	$reply->send();
	exit();
}



add_action( 'wp_ajax_pm_new_todo', 'pm_new_todo' );
add_action( 'wp_ajax_nopriv_pm_new_todo', 'pm_new_todo' );

function pm_new_todo() {
	write_log('pm_new_todo');
	$user_id = $_REQUEST['user_id'];
	//$post_id = $_REQUEST['post_id'];
	$title = $_REQUEST['title'];
	$pmFilter = $_REQUEST['pm_filter'];
	$response = 'failed';

	$logged_in_id = get_current_user_id();

	if ($user_id == $logged_in_id){
		$post_args = array(
			'post_type' => 'todo',
			'post_title' => $title,
			'post_status'  => 'publish',
			);

		$new_post = wp_insert_post($post_args);
		if ($new_post){
			update_post_meta($new_post,'pm_filter',$pmFilter );
			update_post_meta($new_post,'x_pos','50' );
			update_post_meta($new_post,'y_pos','50' );
			$response = $new_post;
		} else {
			write_log('update todo failed');
			$response = 'UpdateFailed';
		}


	} else {

		$response = 'badId';

	}

	$reply = new WP_Ajax_Response;

	$reply->add( array(
		'data' => 'recieved',
		'supplemental' => array(
			'status' => $response,
			'newId' => $update_post
			)
		));

	$reply->send();

	exit();

}




add_action( 'wp_ajax_pm_update_position', 'pm_update_position' );
add_action( 'wp_ajax_nopriv_pm_update_position', 'pm_update_position' );

function pm_update_position() {
	write_log('doing pm_update_position');
	$user_id = $_REQUEST['user_id'];
	$post_id = $_REQUEST['post_id'];
	$xpos = $_REQUEST['xpos'];
	$ypos = $_REQUEST['ypos'];
	$response = 0;

	$logged_in_id = get_current_user_id();
	write_log('$user_id:'.$user_id);
	write_log('$logged_in_id:'.$logged_in_id);
	write_log('$post_id:'.$post_id);
	write_log('$xpos:'.$xpos);
	write_log('$ypos:'.$ypos);

	if (($user_id == $logged_in_id) && ($post_id)){
		write_log('doing update');
		$updated_x = update_post_meta($post_id,'x_pos',$xpos);
		$updated_y = update_post_meta($post_id,'y_pos',$ypos);	

	} else {
		write_log('updating failed');
		$response = 'badId';
	}

	if ($updated_x && $updated_y){
		$response = 1;
	} else {
		$response = 'metaFailed';
	}

	$reply = new WP_Ajax_Response;

	write_log('$response:'.$response);

	$reply->add( array(
		'data' => 'recieved',
		'supplemental' => array(
			'status' => $response,
			)
		));

	$reply->send();

	exit();

}




add_action( 'wp_ajax_pm_update_filters', 'pm_update_filters' );
add_action( 'wp_ajax_nopriv_pm_update_filters', 'pm_update_filters' );

function pm_update_filters() {
	write_log('doing pm_update_filters');
	$user_id = $_REQUEST['user_id'];
	$npm_filter_one_label = $_REQUEST['npm_filter_one_label'];
	$npm_filter_one_color = $_REQUEST['npm_filter_one_color'];
	$npm_filter_two_label = $_REQUEST['npm_filter_two_label'];
	$npm_filter_two_color = $_REQUEST['npm_filter_two_label'];
	$npm_filter_three_label = $_REQUEST['npm_filter_three_label'];
	$npm_filter_three_color = $_REQUEST['npm_filter_three_label'];
	$npm_active_filter = $_REQUEST['npm_active_filter'];
	$response = 0;

	$logged_in_id = get_current_user_id();

	if ($user_id == $logged_in_id){
		write_log('doing filters update');

		$updated_npm_filter_one_label = update_option( 'npm_filter_one_label',$npm_filter_one_label );
		$updated_npm_filter_one_color = update_option( 'npm_filter_one_color',$npm_filter_one_color );
		$updated_npm_filter_two_label = update_option( 'npm_filter_two_label',$npm_filter_two_label );
		$updated_npm_filter_two_color = update_option( 'npm_filter_two_color',$npm_filter_two_color );
		$updated_npm_filter_three_label = update_option( 'npm_filter_three_label',$npm_filter_three_label );
		$updated_npm_filter_three_color = update_option( 'npm_filter_three_color',$npm_filter_three_color );
		$npm_active_filter = update_option( 'npm_active_filter', $npm_active_filter);

		if ($updated_npm_filter_one_label && $updated_npm_filter_one_color && $updated_npm_filter_two_label && $updated_npm_filter_two_color && $updated_npm_filter_three_label && $updated_npm_filter_three_color){
			write_log('npm_filters_updated');
			$response = 'updated';
		}

	} else {
		write_log('updating failed');
		$response = 'badId';
	}

	$reply = new WP_Ajax_Response;

	write_log('$response:'.$response);

	$reply->add( array(
		'data' => 'recieved',
		'supplemental' => array(
			'status' => $response,
			)
		));

	$reply->send();

	exit();

}






