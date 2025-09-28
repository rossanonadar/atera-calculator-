<?php
/**
 * Plugin Name:       Atera Compact Calculator
 * Description:       Provides the "Atera Compact Calculator" Gutenberg block for estimating savings.
 * Version:           1.0.0
 * Author:            Atera
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// die();


/**
 * Safely resolve an asset version based on modification time.
 */
function atera_compact_calculator_asset_version( $relative_path ) {
    $absolute_path = plugin_dir_path( __FILE__ ) . ltrim( $relative_path, '/' );

    if ( file_exists( $absolute_path ) ) {
        return filemtime( $absolute_path );
    }

    return '1.0.0';
}

function atera_compact_calculator_register_block() {
    $asset_url = plugins_url( 'assets/', __FILE__ );

    wp_register_script(
        'atera-compact-calculator-block',
        $asset_url . 'js/block.js',
        array( 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-components', 'wp-block-editor' ),
        atera_compact_calculator_asset_version( 'assets/js/block.js' ),
        true
    );

    wp_register_script(
        'atera-compact-calculator-frontend',
        $asset_url . 'js/frontend.js',
        array(),
        atera_compact_calculator_asset_version( 'assets/js/frontend.js' ),
        true
    );

    wp_register_style(
        'atera-compact-calculator-style',
        $asset_url . 'css/style.css',
        array(),
        atera_compact_calculator_asset_version( 'assets/css/style.css' )
    );

    wp_register_style(
        'atera-compact-calculator-editor-style',
        $asset_url . 'css/editor.css',
        array( 'wp-edit-blocks' ),
        atera_compact_calculator_asset_version( 'assets/css/editor.css' )
    );

    register_block_type(
        'atera/compact-calculator',
        array(
            'editor_script' => 'atera-compact-calculator-block',
            'script'        => 'atera-compact-calculator-frontend',
            'style'         => 'atera-compact-calculator-style',
            'editor_style'  => 'atera-compact-calculator-editor-style',
        )
    );
}
add_action( 'init', 'atera_compact_calculator_register_block' );
