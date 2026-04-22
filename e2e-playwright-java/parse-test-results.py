#!/usr/bin/env python3
"""Parse JUnit XML test results and output JSON summary"""
import xml.etree.ElementTree as ET
import json
import sys
import glob
import os

def parse_junit_xml(xml_file):
    """Parse a single JUnit XML file"""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        tests = int(root.get('tests', 0))
        failures = int(root.get('failures', 0))
        errors = int(root.get('errors', 0))
        skipped = int(root.get('skipped', 0))
        
        failed_tests = []
        for testcase in root.findall('.//testcase'):
            failure = testcase.find('failure')
            error = testcase.find('error')
            
            if failure is not None or error is not None:
                classname = testcase.get('classname', '')
                name = testcase.get('name', '')
                message = ''
                
                if failure is not None:
                    message = failure.get('message', '')[:300]
                elif error is not None:
                    message = error.get('message', '')[:300]
                
                failed_tests.append({
                    'name': f"{classname}.{name}",
                    'message': message
                })
        
        return {
            'tests': tests,
            'failures': failures,
            'errors': errors,
            'skipped': skipped,
            'failed_tests': failed_tests
        }
    except Exception as e:
        print(f"Error parsing {xml_file}: {e}", file=sys.stderr)
        return None

def main():
    results_dir = sys.argv[1] if len(sys.argv) > 1 else 'target/surefire-reports'
    
    xml_files = glob.glob(os.path.join(results_dir, 'TEST-*.xml'))
    
    if not xml_files:
        print(json.dumps({
            'total': 0,
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'failed_tests': []
        }))
        return
    
    total_tests = 0
    total_failures = 0
    total_errors = 0
    total_skipped = 0
    all_failed_tests = []
    
    for xml_file in xml_files:
        result = parse_junit_xml(xml_file)
        if result:
            total_tests += result['tests']
            total_failures += result['failures']
            total_errors += result['errors']
            total_skipped += result['skipped']
            all_failed_tests.extend(result['failed_tests'])
    
    total_failed = total_failures + total_errors
    total_passed = total_tests - total_failed - total_skipped
    
    summary = {
        'total': total_tests,
        'passed': total_passed,
        'failed': total_failed,
        'skipped': total_skipped,
        'failed_tests': all_failed_tests
    }
    
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()
